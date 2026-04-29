"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";
import { SignIn } from "@clerk/nextjs";
import { MoonStar, BookOpen, Clock, CheckCircle2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import LocaleSwitcher from "@/app/components/LocaleSwitcher";

export default function OnboardingFlow() {
  const t = useTranslations("onboarding");
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) return;
    localStorage.removeItem("accent-color");
    document.documentElement.setAttribute("data-color", "green");
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || isSignedIn) return null;

  return (
    <div className="h-svh flex flex-col items-center justify-between py-8 px-4">
      <div className="w-full max-w-sm flex flex-col gap-5">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
            <MoonStar className="w-8 h-8 text-primary" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {t("appName")}
            </h1>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {t("tagline")}
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              {
                Icon: BookOpen,
                title: t("features.trackTitle"),
                desc: t("features.trackDesc"),
              },
              {
                Icon: Clock,
                title: t("features.timesTitle"),
                desc: t("features.timesDesc"),
              },
              {
                Icon: CheckCircle2,
                title: t("features.stayTitle"),
                desc: t("features.stayDesc"),
              },
            ] as const
          ).map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-primary/5 border border-primary/10 p-3 text-center"
            >
              <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="text-xs font-semibold leading-tight">
                {title}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {desc}
              </span>
            </div>
          ))}
        </div>

        {/* Clerk Sign In */}
        <div className="w-full flex justify-center">
          <SignIn
            routing="hash"
            forceRedirectUrl="/"
            signUpForceRedirectUrl="/"
          />
        </div>
      </div>

      {/* Locale switcher pinned to bottom */}
      <LocaleSwitcher />
    </div>
  );
}
