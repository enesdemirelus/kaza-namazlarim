"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SignIn } from "@clerk/nextjs";
import { MoonStar, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

function Dots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full transition-all duration-300",
            i + 1 === step
              ? "w-6 h-2 bg-primary"
              : i + 1 < step
                ? "w-2 h-2 bg-primary/40"
                : "w-2 h-2 bg-muted-foreground/25",
          )}
        />
      ))}
    </div>
  );
}

function StepWelcome({ onNext }: { onNext: () => void }) {
  const t = useTranslations("onboarding");
  return (
    <div className="flex flex-col items-center justify-center gap-8 flex-1 text-center px-6">
      <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center">
        <MoonStar className="w-12 h-12 text-primary" strokeWidth={1.5} />
      </div>
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{t("appName")}</h1>
        <p className="text-base text-muted-foreground whitespace-pre-line leading-relaxed">{t("tagline")}</p>
      </div>
      <button
        onClick={onNext}
        className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity"
      >
        {t("getStarted")} <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function StepSignIn({ onBack }: { onBack: () => void }) {
  const t = useTranslations("onboarding");
  return (
    <div className="flex flex-col items-center gap-6 flex-1 w-full px-6">
      <div className="text-center space-y-1 w-full">
        <h2 className="text-2xl font-bold tracking-tight">{t("almostThere")}</h2>
        <p className="text-sm text-muted-foreground">{t("signInSubtitle")}</p>
      </div>
      <div className="w-full flex justify-center">
        <SignIn forceRedirectUrl="/onboarding/post-auth" signUpForceRedirectUrl="/onboarding/post-auth" />
      </div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> {t("back2")}
      </button>
    </div>
  );
}

const TOTAL_STEPS = 2;

export default function OnboardingFlow() {
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <div className="min-h-svh flex flex-col items-center justify-center py-10">
      <div className="w-full max-w-sm flex flex-col min-h-[600px]">
        <div className="flex items-center justify-between px-6 mb-8">
          <Dots step={step} total={TOTAL_STEPS} />
          <span className="text-xs text-muted-foreground tabular-nums">{step} / {TOTAL_STEPS}</span>
        </div>
        {step === 1 && <StepWelcome onNext={() => setStep(2)} />}
        {step === 2 && <StepSignIn onBack={() => setStep(1)} />}
      </div>
    </div>
  );
}
