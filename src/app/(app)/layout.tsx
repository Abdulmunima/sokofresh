import { BottomTabs } from "@/components/shell/bottom-tabs";
import { OfflineBanner } from "@/components/shell/offline-banner";
import { ToastProvider } from "@/components/ui/toast";
import { requireMember } from "@/lib/auth/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Signed out → /login, no business yet → /welcome.
  await requireMember();
  return (
    <ToastProvider>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <OfflineBanner />
        {children}
      </div>
      <BottomTabs />
    </ToastProvider>
  );
}
