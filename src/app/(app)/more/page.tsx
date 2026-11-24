import { Languages, Palette } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LanguageSwitch } from "@/components/shell/language-switch";
import { PageHeader } from "@/components/shell/page-header";
import { List, ListItem } from "@/components/ui/list-item";

export async function generateMetadata() {
  const t = await getTranslations("Nav");
  return { title: t("more") };
}

export default async function MorePage() {
  const t = await getTranslations();
  return (
    <>
      <PageHeader title={t("Nav.more")} />
      <section className="flex flex-col gap-3 px-4 py-4">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Languages aria-hidden className="text-brand size-5" />
          {t("Language.label")}
        </h2>
        <LanguageSwitch />
      </section>
      <List className="border-border border-t">
        <ListItem
          href="/more/design"
          leading={<Palette />}
          title={t("More.design")}
          subtitle={t("More.designHint")}
        />
      </List>
    </>
  );
}
