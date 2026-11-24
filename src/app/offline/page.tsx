import { WifiOff } from "lucide-react";
import en from "../../../messages/en.json";
import sw from "../../../messages/sw.json";

export const metadata = { title: "Offline · Huna mtandao" };

// Precached by the service worker and shown for pages that were never opened online.
// It is saved once at install, so it shows both languages instead of reading the cookie.
export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <span className="bg-surface text-brand flex size-20 items-center justify-center rounded-full">
        <WifiOff aria-hidden className="size-10" />
      </span>
      {[en, sw].map((m, i) => (
        <section key={i} lang={i === 0 ? "en" : "sw"} className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">{m.Offline.title}</h1>
          <p className="text-muted text-base">{m.Offline.body}</p>
        </section>
      ))}
      {/* A plain link (not next/link): a full reload is what we want once back online. */}
      <a
        href="/orders"
        className="bg-brand text-brand-foreground inline-flex min-h-12 items-center justify-center rounded-xl px-6 font-semibold"
      >
        {en.Offline.retry} · {sw.Offline.retry}
      </a>
    </main>
  );
}
