import { SignIn } from "@clerk/nextjs";
import { MoonStar } from "lucide-react";
import { getTranslations } from "next-intl/server";
import LocaleSwitcher from "@/app/components/LocaleSwitcher";

export default async function LoginPage() {
  const t = await getTranslations("onboarding");
  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-8 p-6" style={{ background: "var(--bg-gradient)" }}>
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <MoonStar className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t("appName")}</h1>
        <p className="text-sm text-muted-foreground whitespace-pre-line">{t("tagline")}</p>
      </div>
      <SignIn
        routing="hash"
        forceRedirectUrl="/onboarding/check"
        signUpForceRedirectUrl="/onboarding/check"
      />
      <LocaleSwitcher />
    </div>
  );
}
