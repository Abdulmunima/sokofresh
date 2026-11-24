"use client";

import { Plus, Phone, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { List, ListItem } from "@/components/ui/list-item";
import { MoneyText } from "@/components/ui/money-text";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  OrderStatusChip,
  PaymentStatusChip,
  StockStatusChip,
  type OrderStatus,
} from "@/components/ui/status-chip";
import { useToast } from "@/components/ui/toast";
import { Constants } from "@/lib/supabase/database.types";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-border flex flex-col gap-3 border-b py-5">
      <h2 className="text-muted px-4 text-sm font-bold tracking-wide uppercase">{title}</h2>
      {children}
    </section>
  );
}

export function DesignPreview() {
  const t = useTranslations("Design");
  const toast = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [status, setStatus] = useState<OrderStatus>("confirmed");

  const markPacked = () => {
    const previous = status;
    setStatus("packed");
    toast({ message: t("toastPacked"), onUndo: () => setStatus(previous) });
  };

  return (
    <div className="flex flex-col">
      <p className="bg-surface text-muted mx-4 mt-4 rounded-xl p-3 text-sm">{t("intro")}</p>

      <Section title={t("buttons")}>
        <div className="flex flex-col gap-3 px-4">
          <Button block icon={<Plus />}>
            {t("newOrder")}
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" icon={<Phone />} className="flex-1">
              {t("call")}
            </Button>
            <Button variant="ghost" className="flex-1">
              {t("skip")}
            </Button>
          </div>
        </div>
      </Section>

      <Section title={t("orderRows")}>
        <List>
          <ListItem
            href="#"
            leading={<span className="text-foreground text-base font-bold">JH</span>}
            title="Java House Westlands"
            subtitle={t("exampleOrderLine", { number: 14, items: 3 })}
            trailing={
              <>
                <MoneyText amount={22700} />
                <OrderStatusChip status={status} />
              </>
            }
          />
          <ListItem
            href="#"
            leading={<span className="text-foreground text-base font-bold">NM</span>}
            title="Nyama Mama Restaurant"
            subtitle={t("exampleOrderLine", { number: 8, items: 4 })}
            trailing={
              <>
                <MoneyText amount={16840} tone="owed" />
                <PaymentStatusChip status="overdue" />
              </>
            }
          />
        </List>
        <div className="px-4">
          <Button
            variant="secondary"
            block
            icon={<Truck />}
            onClick={markPacked}
            disabled={status === "packed"}
          >
            {t("markPacked")}
          </Button>
        </div>
      </Section>

      <Section title={t("orderChips")}>
        <div className="flex flex-wrap gap-2 px-4">
          {Constants.public.Enums.order_status.map((s) => (
            <OrderStatusChip key={s} status={s} />
          ))}
        </div>
      </Section>

      <Section title={t("paymentChips")}>
        <div className="flex flex-wrap gap-2 px-4">
          {(["unpaid", "part_paid", "paid", "overdue"] as const).map((s) => (
            <PaymentStatusChip key={s} status={s} />
          ))}
        </div>
      </Section>

      <Section title={t("stockChips")}>
        <div className="flex flex-wrap gap-2 px-4">
          {Constants.public.Enums.stock_status.map((s) => (
            <StockStatusChip key={s} status={s} />
          ))}
        </div>
      </Section>

      <Section title={t("money")}>
        <div className="flex flex-col gap-1 px-4">
          <MoneyText amount={34895} size="xl" tone="owed" />
          <span className="text-muted text-sm">{t("totalOwed")}</span>
          <MoneyText amount="1500.50" />
          <MoneyText amount={21050} tone="credit" />
        </div>
      </Section>

      <Section title={t("phone")}>
        <div className="px-4">
          <PhoneInput name="phone" />
        </div>
      </Section>

      <Section title={t("sheet")}>
        <div className="px-4">
          <Button variant="secondary" block onClick={() => setSheetOpen(true)}>
            {t("openSheet")}
          </Button>
        </div>
        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={t("sheetTitle")}>
          <p className="text-muted text-base">{t("sheetBody")}</p>
          <Button block onClick={() => setSheetOpen(false)}>
            {t("done")}
          </Button>
        </BottomSheet>
      </Section>
    </div>
  );
}
