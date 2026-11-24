import { BottomTabs } from "@/components/shell/bottom-tabs";
import { ToastProvider } from "@/components/ui/toast";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <ToastProvider>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <BottomTabs />
    </ToastProvider>
  );
}
