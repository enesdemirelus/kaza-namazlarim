import { SignIn } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";
import LocaleSwitcher from "@/app/components/LocaleSwitcher";
import Image from "next/image";
import appIcon from "@/app/icon0.svg";

export default async function SignInPage() {
  const tNav = await getTranslations("nav");
  const t = await getTranslations("signIn");

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center md:gap-6 md:px-4 md:py-10">

      {/* ── MOBILE layout ── */}
      <div className="md:hidden w-full flex flex-col items-center gap-5 px-4 py-10">

        {/* Branding */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Image src={appIcon} alt="App icon" width={144} height={144} className="rounded-2xl" />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{tNav("title")}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px] mx-auto">
              {t("tagline")}
            </p>
          </div>
        </div>

        {/* Clerk card */}
        <div className="w-full [&_.cl-header]:hidden! [&_.cl-rootBox]:w-full! [&_.cl-cardBox]:w-full! [&_.cl-card]:w-full! [&_.cl-card]:shadow-sm! [&_.cl-card]:rounded-2xl!">
          <SignIn />
        </div>

        <LocaleSwitcher />

      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden md:flex flex-col items-center gap-6 w-full max-w-sm">

        <header className="flex flex-col items-center gap-3 text-center">
          <Image src={appIcon} alt="App icon" width={144} height={144} className="rounded-2xl" />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{tNav("title")}</h1>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{t("tagline")}</p>
          </div>
        </header>

        <div className="w-full [&_.cl-header]:hidden! [&_.cl-rootBox]:w-full! [&_.cl-cardBox]:w-full! [&_.cl-card]:w-full!">
          <SignIn />
        </div>

        <LocaleSwitcher />
      </div>

    </main>
  );
}
