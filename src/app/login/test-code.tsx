"use client";

import { FlaskConical } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { isDemoNumber, showTestCodes } from "@/lib/auth/demo";
import { createClient } from "@/lib/supabase/client";

/**
 * Test site only: until WhatsApp delivery is set up, show the code sent to a demo number.
 * Renders nothing on production or for real numbers.
 */
export function TestCode({
  phone,
  sentAt,
  onUse,
}: {
  phone: string;
  sentAt: number;
  onUse: (code: string) => void;
}) {
  const t = useTranslations("Login");
  const [code, setCode] = useState<string | null>(null);
  const enabled = showTestCodes() && isDemoNumber(phone);

  useEffect(() => {
    if (!enabled) return;
    let stop = false;
    const supabase = createClient();
    (async () => {
      // Give a fresh code a moment to arrive (after "Send again" the old one is still there).
      if (sentAt > 0) await new Promise((r) => setTimeout(r, 1500));
      for (let i = 0; i < 12 && !stop; i++) {
        const { data } = await supabase.rpc("dev_latest_login_code", { p_phone: phone });
        if (data && !stop) {
          setCode(data);
          return;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    })();
    return () => {
      stop = true;
    };
  }, [enabled, phone, sentAt]);

  if (!enabled || !code) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-3 text-amber-950">
      <FlaskConical aria-hidden className="size-5 shrink-0" />
      <p className="flex-1 text-sm">
        {t("testCode")} <strong className="text-lg tracking-widest tabular-nums">{code}</strong>
      </p>
      <button
        type="button"
        onClick={() => onUse(code)}
        className="min-h-12 rounded-xl bg-amber-200 px-3 text-sm font-semibold active:bg-amber-300"
      >
        {t("useTestCode")}
      </button>
    </div>
  );
}
