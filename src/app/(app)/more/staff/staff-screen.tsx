"use client";

import { MessageCircle, Clock, UserPlus, UserMinus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Choice, Field } from "@/components/setup/choice";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { List, ListItem } from "@/components/ui/list-item";
import { PhoneInput } from "@/components/ui/phone-input";
import { useToast } from "@/components/ui/toast";
import { formatPhoneKE } from "@/lib/phone";
import {
  ASSIGNABLE_ROLES,
  canEditMember,
  initials,
  type AssignableRole,
  type Role,
} from "@/lib/team";
import { waLink } from "@/lib/whatsapp";
import {
  addPerson,
  cancelInvite,
  changeRole,
  removePerson,
  restoreInvite,
  restorePerson,
} from "./actions";

export type Member = { userId: string; name: string | null; phone: string | null; role: Role };
export type Invite = { phone: string; name: string | null; role: AssignableRole };

type Props = {
  me: { id: string; role: Role };
  businessName: string;
  canManage: boolean;
  members: Member[];
  invites: Invite[];
};

export function StaffScreen({ me, businessName, canManage, members, invites }: Props) {
  const t = useTranslations("Staff");
  const tRoles = useTranslations("Account.roles");
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [, startTransition] = useTransition();

  /** WhatsApp message telling someone how to log in. */
  const inviteMessage = (name: string | null, phone: string) =>
    waLink(
      phone,
      t("inviteMessage", {
        name: name ?? "",
        business: businessName,
        url: `${window.location.origin}/login`,
        phone: formatPhoneKE(phone),
      }),
    );

  const remove = (m: Member) => {
    setEditing(null);
    startTransition(async () => {
      const result = await removePerson(m.userId);
      if (!result.ok) return toast({ message: t("errors.failed") });
      toast({
        message: t("removed", { name: m.name ?? formatPhoneKE(m.phone) }),
        onUndo: () =>
          startTransition(async () => void (await restorePerson(m.userId, result.role))),
      });
    });
  };

  const cancel = (i: Invite) => {
    setInvite(null);
    startTransition(async () => {
      const result = await cancelInvite(i.phone);
      if (!result.ok) return toast({ message: t("errors.failed") });
      toast({
        message: t("inviteCancelled", { name: i.name ?? formatPhoneKE(i.phone) }),
        onUndo: () =>
          startTransition(
            async () => void (await restoreInvite(i.phone, result.role, result.name)),
          ),
      });
    });
  };

  return (
    <div className="flex flex-col">
      <section aria-labelledby="team-heading" className="pt-4">
        <h2 id="team-heading" className="text-muted px-4 text-sm font-bold tracking-wide uppercase">
          {t("team", { count: members.length })}
        </h2>
        <List>
          {members.map((m) => {
            const editable = canEditMember(me.role, me.id, m);
            const title = m.name ?? formatPhoneKE(m.phone);
            const you = m.userId === me.id ? ` · ${t("you")}` : "";
            return (
              <ListItem
                key={m.userId}
                leading={
                  <span className="text-foreground text-base font-bold">{initials(m.name)}</span>
                }
                title={title}
                subtitle={`${tRoles(m.role)}${you}${m.name && m.phone ? ` · ${formatPhoneKE(m.phone)}` : ""}`}
                onClick={editable ? () => setEditing(m) : undefined}
              />
            );
          })}
        </List>
      </section>

      {invites.length > 0 && (
        <section aria-labelledby="waiting-heading" className="border-border border-t pt-4">
          <h2
            id="waiting-heading"
            className="text-muted px-4 text-sm font-bold tracking-wide uppercase"
          >
            {t("waiting")}
          </h2>
          <List>
            {invites.map((i) => (
              <ListItem
                key={i.phone}
                leading={<Clock />}
                title={i.name ?? formatPhoneKE(i.phone)}
                subtitle={`${tRoles(i.role)} · ${i.name ? `${formatPhoneKE(i.phone)} · ` : ""}${t("notLoggedInYet")}`}
                onClick={canManage ? () => setInvite(i) : undefined}
              />
            ))}
          </List>
        </section>
      )}

      {canManage ? (
        <div className="border-border border-t px-4 py-5">
          <Button block icon={<UserPlus />} onClick={() => setAdding(true)}>
            {t("add")}
          </Button>
        </div>
      ) : (
        <p className="border-border text-muted border-t p-4 text-base">{t("onlyOwner")}</p>
      )}

      {canManage && (
        <AddPersonSheet open={adding} onClose={() => setAdding(false)} inviteLink={inviteMessage} />
      )}

      {/* Change role or remove */}
      <BottomSheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.name ?? formatPhoneKE(editing?.phone)}
      >
        {editing && (
          <div className="flex flex-col gap-4">
            <RolePicker
              value={editing.role as AssignableRole}
              onChange={(role) => {
                const m = editing;
                setEditing({ ...m, role });
                startTransition(async () => {
                  const result = await changeRole(m.userId, role);
                  toast({
                    message: result.ok
                      ? t("roleChanged", { role: tRoles(role) })
                      : t("errors.failed"),
                  });
                });
              }}
            />
            <Button variant="danger" block icon={<UserMinus />} onClick={() => remove(editing)}>
              {t("remove")}
            </Button>
          </div>
        )}
      </BottomSheet>

      {/* Waiting invite */}
      <BottomSheet
        open={invite !== null}
        onClose={() => setInvite(null)}
        title={invite?.name ?? formatPhoneKE(invite?.phone)}
      >
        {invite && (
          <div className="flex flex-col gap-3">
            <p className="text-muted text-base">{t("inviteHint")}</p>
            <a
              href={inviteMessage(invite.name, invite.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand text-brand-foreground inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 font-semibold"
            >
              <MessageCircle aria-hidden className="size-5" />
              {t("sendWhatsApp")}
            </a>
            <Button variant="secondary" block onClick={() => cancel(invite)}>
              {t("cancelInvite")}
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

function RolePicker({
  value,
  onChange,
}: {
  value: AssignableRole;
  onChange: (r: AssignableRole) => void;
}) {
  const t = useTranslations("Staff");
  const tRoles = useTranslations("Account.roles");
  return (
    <div role="radiogroup" aria-label={t("role")} className="flex flex-col gap-2">
      {ASSIGNABLE_ROLES.map((r) => (
        <Choice
          key={r}
          selected={value === r}
          onSelect={() => onChange(r)}
          label={tRoles(r)}
          hint={t(`roleHints.${r}`)}
        />
      ))}
    </div>
  );
}

function AddPersonSheet({
  open,
  onClose,
  inviteLink,
}: {
  open: boolean;
  onClose: () => void;
  inviteLink: (name: string | null, phone: string) => string;
}) {
  const t = useTranslations("Staff");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [role, setRole] = useState<AssignableRole>("staff");
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<{ result: string; phone: string; name: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  const close = () => {
    onClose();
    setAdded(null);
    setName("");
    setPhone(null);
    setRole("staff");
    setError(null);
    setFormKey((k) => k + 1); // fresh phone field next time
  };

  return (
    <BottomSheet open={open} onClose={close} title={t("add")}>
      {added ? (
        <div className="flex flex-col gap-3">
          <p role="status" className="text-lg">
            {t(`addedResult.${added.result}`, { name: added.name || formatPhoneKE(added.phone) })}
          </p>
          <a
            href={inviteLink(added.name || null, added.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-brand text-brand-foreground inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 font-semibold"
          >
            <MessageCircle aria-hidden className="size-5" />
            {t("sendWhatsApp")}
          </a>
          <Button variant="secondary" block onClick={close}>
            {t("done")}
          </Button>
        </div>
      ) : (
        <form
          key={formKey}
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!phone) return setError(t("errors.invalid_phone"));
            setError(null);
            startTransition(async () => {
              const result = await addPerson({ name, phone, role });
              if (result.ok)
                setAdded({ result: result.result, phone: result.phone, name: name.trim() });
              else setError(t(`errors.${result.error}`));
            });
          }}
        >
          <Field
            id="person-name"
            label={t("name")}
            value={name}
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
          />
          <PhoneInput name="person-phone" onValueChange={setPhone} />
          <RolePicker value={role} onChange={setRole} />
          {error && (
            <p role="alert" className="text-danger text-base">
              {error}
            </p>
          )}
          <Button type="submit" block icon={<UserPlus />} disabled={pending}>
            {pending ? t("adding") : t("addButton")}
          </Button>
        </form>
      )}
    </BottomSheet>
  );
}
