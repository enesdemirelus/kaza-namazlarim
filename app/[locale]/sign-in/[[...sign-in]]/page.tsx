import { SignIn } from "@clerk/nextjs";
import { MoonStar, BookOpenCheck, Clock, Heart } from "lucide-react";
import { getTranslations } from "next-intl/server";
import LocaleSwitcher from "@/app/components/LocaleSwitcher";

const FEATURES = [
  { Icon: BookOpenCheck, key: "track" },
  { Icon: Clock, key: "times" },
  { Icon: Heart, key: "stay" },
] as const;

export default async function SignInPage() {
  const tNav = await getTranslations("nav");
  const t = await getTranslations("signIn");

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center md:gap-6 md:px-4 md:py-10">

      {/* ── MOBILE layout ── */}
      <div className="md:hidden w-full flex flex-col items-center gap-5 px-4 py-10">

        {/* Branding */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <MoonStar className="w-7 h-7 text-primary" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{tNav("title")}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px] mx-auto">
              {t("tagline")}
            </p>
          </div>
          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {FEATURES.map(({ Icon, key }) => (
              <div key={key} className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5">
                <Icon className="w-3 h-3 text-primary shrink-0" strokeWidth={2} />
                <span className="text-[11px] font-medium">{t(`features.${key}Title`)}</span>
              </div>
            ))}
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
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <MoonStar className="w-7 h-7 text-primary" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{tNav("title")}</h1>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{t("tagline")}</p>
          </div>
        </header>

        <div className="w-full grid grid-cols-3 gap-2">
          {FEATURES.map(({ Icon, key }) => (
            <div key={key} className="flex flex-col items-center gap-1.5 rounded-2xl border bg-card p-3 text-center">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-[11px] font-semibold leading-tight">{t(`features.${key}Title`)}</p>
                <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{t(`features.${key}Desc`)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full [&_.cl-header]:hidden! [&_.cl-rootBox]:w-full! [&_.cl-cardBox]:w-full! [&_.cl-card]:w-full!">
          <SignIn />
        </div>

        <LocaleSwitcher />
      </div>

    </main>
  );
}
