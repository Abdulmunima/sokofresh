import {
  Ban,
  CircleCheck,
  CircleDot,
  Clock,
  Package,
  PackageCheck,
  Truck,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { Enum } from "@/lib/supabase/types";
import { cx } from "@/lib/cx";

export type OrderStatus = Enum<"order_status">;
/** Stored payment status plus the derived "overdue". */
export type PaymentStatus = Enum<"order_payment_status"> | "overdue";
export type StockStatus = Enum<"stock_status">;

type Style = { icon: LucideIcon; className: string };

const orderStyles: Record<OrderStatus, Style> = {
  new: { icon: CircleDot, className: "bg-sky-100 text-sky-900" },
  confirmed: { icon: CircleCheck, className: "bg-indigo-100 text-indigo-900" },
  packed: { icon: Package, className: "bg-amber-100 text-amber-900" },
  out_for_delivery: { icon: Truck, className: "bg-orange-100 text-orange-900" },
  delivered: { icon: PackageCheck, className: "bg-green-100 text-green-900" },
  cancelled: { icon: Ban, className: "bg-zinc-200 text-zinc-700" },
};

const paymentStyles: Record<PaymentStatus, Style> = {
  unpaid: { icon: Clock, className: "bg-zinc-100 text-zinc-800" },
  part_paid: { icon: CircleDot, className: "bg-amber-100 text-amber-900" },
  paid: { icon: CircleCheck, className: "bg-green-100 text-green-900" },
  overdue: { icon: AlertTriangle, className: "bg-red-100 text-red-900" },
};

const stockStyles: Record<StockStatus, Style> = {
  in_stock: { icon: CircleCheck, className: "bg-green-100 text-green-900" },
  low: { icon: AlertTriangle, className: "bg-amber-100 text-amber-900" },
  out: { icon: Ban, className: "bg-zinc-200 text-zinc-700" },
};

function Chip({ style, label }: { style: Style; label: string }) {
  const Icon = style.icon;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold whitespace-nowrap",
        style.className,
      )}
    >
      <Icon aria-hidden className="size-4" />
      {label}
    </span>
  );
}

export function OrderStatusChip({ status }: { status: OrderStatus }) {
  const t = useTranslations("OrderStatus");
  return <Chip style={orderStyles[status]} label={t(status)} />;
}

export function PaymentStatusChip({ status }: { status: PaymentStatus }) {
  const t = useTranslations("PaymentStatus");
  return <Chip style={paymentStyles[status]} label={t(status)} />;
}

export function StockStatusChip({ status }: { status: StockStatus }) {
  const t = useTranslations("StockStatus");
  return <Chip style={stockStyles[status]} label={t(status)} />;
}
