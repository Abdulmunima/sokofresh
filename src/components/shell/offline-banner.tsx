"use client";

import { WifiOff } from "lucide-react";
import { useOffline } from "next/offline";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useRef, useSyncExternalStore } from "react";

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}
const noSubscribe = () => () => {};

/** When the page was rendered on the server (set on <html> by the root layout). */
function readSavedAt(): number | null {
  const ms = Number(document.documentElement.dataset.renderedAt);
  return Number.isFinite(ms) && ms > 0 ? ms : null;
}

/**
 * Amber bar at the top while offline: says the screen may be out of date and since when.
 * When the connection comes back it refreshes the data quietly.
 */
export function OfflineBanner() {
  const t = useTranslations("Offline");
  const format = useFormatter();
  const router = useRouter();
  // useOffline() also catches "Wi-Fi but no internet"; navigator.onLine covers a cold start offline.
  const nextOffline = useOffline();
  const browserOffline = useSyncExternalStore(
    subscribeOnline,
    () => !navigator.onLine,
    () => false,
  );
  const savedAt = useSyncExternalStore(noSubscribe, readSavedAt, () => null);
  const offline = nextOffline || browserOffline;

  const wasOffline = useRef(false);
  useEffect(() => {
    if (offline) wasOffline.current = true;
    else if (wasOffline.current) {
      wasOffline.current = false;
      router.refresh();
    }
  }, [offline, router]);

  if (!offline) return null;
  return (
    <div
      role="status"
      className="flex items-start gap-3 border-b border-amber-300 bg-amber-50 px-4 py-3 text-amber-950"
    >
      <WifiOff aria-hidden className="mt-0.5 size-5 shrink-0" />
      <p className="text-sm">
        <strong className="font-semibold">{t("banner")}</strong>{" "}
        {savedAt
          ? t("savedAt", {
              time: format.dateTime(new Date(savedAt), {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }),
            })
          : t("savedUnknown")}
      </p>
    </div>
  );
}
