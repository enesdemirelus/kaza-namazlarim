import { SignIn } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";

export default async function SignInPage() {
  const t = await getTranslations("signIn");
  const nav = await getTranslations("nav");

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 px-4">

      <div className="text-center">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary">{nav("title")}</p>
        <h1 className="text-2xl font-bold tracking-tight mt-1">{t("welcome")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <SignIn />

    </div>
  );
}
