"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

/** Removes every page saved for offline use, so the next person on a shared phone sees nothing. */
export async function clearSavedPages() {
  if (typeof caches === "undefined") return;
  const names = await caches.keys();
  await Promise.all(names.map((name) => caches.delete(name)));
}

export function SignOutButton() {
  const t = useTranslations("Account");
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      block
      icon={<LogOut />}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await signOut();
          await clearSavedPages();
          // A full page load on purpose: nothing from the old session stays in memory.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign("/login");
        })
      }
    >
      {t("signOut")}
    </Button>
  );
}
