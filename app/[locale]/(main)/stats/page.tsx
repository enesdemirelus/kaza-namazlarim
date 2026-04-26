import { getTranslations } from "next-intl/server";

export default async function StatsPage() {
  const t = await getTranslations("stats");

  return (
    <main className="flex-1 overflow-hidden flex items-center justify-center p-4">
      <p className="text-muted-foreground text-sm">{t("comingSoon")}</p>
    </main>
  );
}
