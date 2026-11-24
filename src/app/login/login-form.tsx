"use client";

import { ArrowLeft, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { formatPhoneKE } from "@/lib/phone";
import { clearSavedPages } from "@/lib/saved-pages";
import { sendCode, verifyCode } from "./actions";

const RESEND_SECONDS = 30;

/** Two steps on one screen: phone number → 6-digit code from WhatsApp. */
export function LoginForm({ next }: { next: string | null }) {
  const t = useTranslations("Login");

  // Anyone on this screen is logged out: make sure no saved business pages remain on the
  // phone, including one the offline helper was still saving when the last person left.
  useEffect(() => {
    void clearSavedPages();
    const later = setTimeout(() => void clearSavedPages(), 3000);
    return () => clearTimeout(later);
  }, []);
  const [phone, setPhone] = useState<string | null>(null); // E.164 once the code is sent
  const [typed, setTyped] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const send = (target: string | null) => {
    if (!target) {
      setError(t("errors.invalid_phone"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await sendCode(target);
      if (result.ok) setPhone(result.phone);
      else setError(t(`errors.${result.error}`));
    });
  };

  if (!phone) {
    return (
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          send(typed);
        }}
      >
        <PhoneInput name="phone" autoFocus required onValueChange={setTyped} />
        {error && (
          <p role="alert" className="text-danger text-base">
            {error}
          </p>
        )}
        <Button type="submit" block icon={<MessageCircle />} disabled={pending}>
          {pending ? t("sending") : t("sendCode")}
        </Button>
        <p className="text-muted text-sm">{t("phoneHint")}</p>
      </form>
    );
  }

  return (
    <CodeStep
      phone={phone}
      next={next}
      onChangeNumber={() => {
        setPhone(null);
        setError(null);
      }}
      onResend={() => send(phone)}
      resendPending={pending}
      resendError={error}
    />
  );
}

function CodeStep({
  phone,
  next,
  onChangeNumber,
  onResend,
  resendPending,
  resendError,
}: {
  phone: string;
  next: string | null;
  onChangeNumber: () => void;
  onResend: () => void;
  resendPending: boolean;
  resendError: string | null;
}) {
  const t = useTranslations("Login");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const submitted = useRef("");

  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const verify = (value: string) => {
    if (value.length !== 6 || submitted.current === value) return;
    submitted.current = value;
    setError(null);
    startTransition(async () => {
      const result = await verifyCode(phone, value, next);
      // Success redirects; only failures come back here.
      if (result && !result.ok) {
        setError(t(`errors.${result.error}`));
        submitted.current = "";
      }
    });
  };

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        verify(code);
      }}
    >
      <p className="text-lg">
        {t.rich("codeSent", {
          phone: formatPhoneKE(phone),
          b: (chunks) => <strong className="font-semibold whitespace-nowrap">{chunks}</strong>,
        })}
      </p>
      <div className="flex flex-col gap-1">
        <label htmlFor="code" className="text-base font-semibold">
          {t("codeLabel")}
        </label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          autoFocus
          value={code}
          aria-invalid={Boolean(error)}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
            setCode(digits);
            if (digits.length === 6) verify(digits); // no extra tap needed
          }}
          className="border-border bg-background focus:border-brand aria-invalid:border-danger min-h-14 rounded-xl border-2 px-4 text-center text-3xl font-semibold tracking-[0.5em] tabular-nums focus:outline-none"
        />
      </div>
      {(error || resendError) && (
        <p role="alert" className="text-danger text-base">
          {error ?? resendError}
        </p>
      )}
      <Button type="submit" block disabled={pending || code.length !== 6}>
        {pending ? t("checking") : t("logIn")}
      </Button>
      <div className="flex gap-3">
        <Button variant="ghost" icon={<ArrowLeft />} className="flex-1" onClick={onChangeNumber}>
          {t("changeNumber")}
        </Button>
        <Button
          variant="ghost"
          className="flex-1"
          disabled={secondsLeft > 0 || resendPending}
          onClick={() => {
            onResend();
            setSecondsLeft(RESEND_SECONDS);
          }}
        >
          {secondsLeft > 0 ? t("resendIn", { seconds: secondsLeft }) : t("resend")}
        </Button>
      </div>
    </form>
  );
}
