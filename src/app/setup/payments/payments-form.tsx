"use client";

import { ArrowRight, Banknote, Landmark, Smartphone, Store, Coins } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { savePaymentMethods } from "@/app/setup/actions";
import { Choice, Field } from "@/components/setup/choice";
import { Button } from "@/components/ui/button";
import type { FieldErrors, PaymentMethodsInput } from "@/lib/onboarding";

const EMPTY: PaymentMethodsInput = {
  cash: true,
  till: { on: false, number: "" },
  paybill: { on: false, number: "", account: "" },
  sendMoney: { on: false, phone: "" },
  bank: { on: false, bank: "", accountName: "", accountNumber: "" },
};

export function PaymentsForm() {
  const t = useTranslations("Setup");
  const [form, setForm] = useState<PaymentMethodsInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const err = (key: string) => (errors[key] ? t(`errors.${errors[key]}`) : undefined);

  const set = <K extends keyof PaymentMethodsInput>(key: K, value: PaymentMethodsInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setFailed(false);
        startTransition(async () => {
          const result = await savePaymentMethods(form);
          if (result && !result.ok) {
            setErrors(result.fields ?? {});
            setFailed(!result.fields);
          }
        });
      }}
    >
      <Choice
        role="checkbox"
        selected={form.till.on}
        onSelect={() => set("till", { ...form.till, on: !form.till.on })}
        icon={<Store />}
        label={t("payments.till")}
      />
      {form.till.on && (
        <Field
          id="till"
          label={t("payments.tillNumber")}
          inputMode="numeric"
          value={form.till.number}
          error={err("till.number")}
          onChange={(e) => set("till", { ...form.till, number: e.target.value })}
        />
      )}

      <Choice
        role="checkbox"
        selected={form.paybill.on}
        onSelect={() => set("paybill", { ...form.paybill, on: !form.paybill.on })}
        icon={<Smartphone />}
        label={t("payments.paybill")}
      />
      {form.paybill.on && (
        <>
          <Field
            id="paybill"
            label={t("payments.paybillNumber")}
            inputMode="numeric"
            value={form.paybill.number}
            error={err("paybill.number")}
            onChange={(e) => set("paybill", { ...form.paybill, number: e.target.value })}
          />
          <Field
            id="paybill-account"
            label={t("payments.paybillAccount")}
            placeholder={t("payments.paybillAccountExample")}
            value={form.paybill.account}
            onChange={(e) => set("paybill", { ...form.paybill, account: e.target.value })}
          />
        </>
      )}

      <Choice
        role="checkbox"
        selected={form.sendMoney.on}
        onSelect={() => set("sendMoney", { ...form.sendMoney, on: !form.sendMoney.on })}
        icon={<Coins />}
        label={t("payments.sendMoney")}
      />
      {form.sendMoney.on && (
        <Field
          id="send-money"
          label={t("payments.sendMoneyPhone")}
          type="tel"
          inputMode="tel"
          placeholder="0712 345 678"
          value={form.sendMoney.phone}
          error={err("sendMoney.phone")}
          onChange={(e) => set("sendMoney", { ...form.sendMoney, phone: e.target.value })}
        />
      )}

      <Choice
        role="checkbox"
        selected={form.bank.on}
        onSelect={() => set("bank", { ...form.bank, on: !form.bank.on })}
        icon={<Landmark />}
        label={t("payments.bank")}
      />
      {form.bank.on && (
        <>
          <Field
            id="bank"
            label={t("payments.bankName")}
            value={form.bank.bank}
            error={err("bank.bank")}
            onChange={(e) => set("bank", { ...form.bank, bank: e.target.value })}
          />
          <Field
            id="bank-account-name"
            label={t("payments.bankAccountName")}
            value={form.bank.accountName}
            error={err("bank.accountName")}
            onChange={(e) => set("bank", { ...form.bank, accountName: e.target.value })}
          />
          <Field
            id="bank-account-number"
            label={t("payments.bankAccountNumber")}
            inputMode="numeric"
            value={form.bank.accountNumber}
            error={err("bank.accountNumber")}
            onChange={(e) => set("bank", { ...form.bank, accountNumber: e.target.value })}
          />
        </>
      )}

      <Choice
        role="checkbox"
        selected={form.cash}
        onSelect={() => set("cash", !form.cash)}
        icon={<Banknote />}
        label={t("payments.cash")}
      />

      <p className="text-muted text-sm">{t("payments.neverTouch")}</p>
      {failed && (
        <p role="alert" className="text-danger">
          {t("errors.failed")}
        </p>
      )}
      <Button type="submit" block icon={<ArrowRight />} disabled={pending}>
        {pending ? t("saving") : t("continue")}
      </Button>
    </form>
  );
}
