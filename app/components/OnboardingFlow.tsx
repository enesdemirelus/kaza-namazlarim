"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useUser } from "@clerk/nextjs";
import { SignIn } from "@clerk/nextjs";
import { MoonStar, Sun, Moon, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT_COLORS = [
  { id: "green",  hue: 150 },
  { id: "teal",   hue: 182 },
  { id: "cyan",   hue: 205 },
  { id: "blue",   hue: 245 },
  { id: "indigo", hue: 268 },
  { id: "violet", hue: 285 },
  { id: "purple", hue: 305 },
  { id: "pink",   hue: 328 },
  { id: "rose",   hue: 12  },
  { id: "orange", hue: 45  },
  { id: "red",    hue: 5   },
  { id: "amber",  hue: 55  },
] as const;

type AccentId = (typeof ACCENT_COLORS)[number]["id"];

function swatchColor(hue: number) {
  return `oklch(0.527 0.16 ${hue})`;
}

const CALCULATION_METHODS = [
  "Turkey", "NorthAmerica", "MuslimWorldLeague", "Egyptian",
  "Karachi", "UmmAlQura", "Dubai", "Kuwait", "Qatar",
  "Singapore", "Tehran", "MoonsightingCommittee",
] as const;

type MethodId = (typeof CALCULATION_METHODS)[number];

// ── Progress dots ─────────────────────────────────────────────────────────────

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

// ── Step 1: Sign in ───────────────────────────────────────────────────────────

function StepSignIn() {
  const t = useTranslations("onboarding");
  return (
    <div className="flex flex-col items-center gap-6 flex-1 w-full px-6">
      <div className="text-center space-y-1 w-full">
        <h2 className="text-2xl font-bold tracking-tight">{t("almostThere")}</h2>
        <p className="text-sm text-muted-foreground">{t("signInSubtitle")}</p>
      </div>
      <div className="w-full flex justify-center">
        <SignIn routing="hash" forceRedirectUrl="/onboarding" signUpForceRedirectUrl="/onboarding" />
      </div>
    </div>
  );
}

// ── Step 2: Welcome ───────────────────────────────────────────────────────────

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

// ── Step 3: Preferences (language, theme, colour) ─────────────────────────────

function StepPreferences({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const t = useTranslations("onboarding");
  const { resolvedTheme, setTheme } = useTheme();
  const locale = useLocale();
  const [accent, setAccentState] = useState<AccentId>("green");

  useEffect(() => {
    setAccentState((localStorage.getItem("accent-color") ?? "green") as AccentId);
  }, []);

  function setAccent(id: AccentId) {
    localStorage.setItem("accent-color", id);
    document.documentElement.setAttribute("data-color", id);
    setAccentState(id);
  }

  function switchLocale(next: "tr" | "en") {
    if (next !== locale) {
      sessionStorage.setItem("knm-onboarding-step", "3");
      window.location.replace(`/${next}/onboarding`);
    }
  }

  return (
    <div className="flex flex-col gap-6 flex-1 w-full max-w-sm mx-auto px-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">{t("makeItYours")}</h2>
        <p className="text-sm text-muted-foreground">{t("makeItYoursSubtitle")}</p>
      </div>

      {/* Language */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("language")}</p>
        <div className="grid grid-cols-2 gap-2">
          {(["tr", "en"] as const).map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={cn(
                "flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-semibold transition-all",
                locale === loc
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              <span className="text-base">{loc === "tr" ? "🇹🇷" : "🇬🇧"}</span>
              {loc === "tr" ? t("turkish") : t("english")}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("theme")}</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: "light", Icon: Sun,  label: t("light") },
            { value: "dark",  Icon: Moon, label: t("dark")  },
          ] as const).map(({ value, Icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                "flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-semibold transition-all",
                resolvedTheme === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Accent */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("accentColour")}</p>
        <div className="grid grid-cols-6 gap-2">
          {ACCENT_COLORS.map(({ id, hue }) => (
            <button key={id} onClick={() => setAccent(id)} className="flex items-center justify-center">
              <span
                className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                  accent === id ? "ring-2 ring-offset-2 ring-foreground/30 scale-110" : "hover:scale-105",
                )}
                style={{ backgroundColor: swatchColor(hue) }}
              >
                {accent === id && <Check className="w-4 h-4 text-white drop-shadow" strokeWidth={2.5} />}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-auto pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t("back")}
        </button>
        <button
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {t("continue")} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Step 4: Prayer method ─────────────────────────────────────────────────────

function StepPrayerMethod({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const t = useTranslations("onboarding");
  const [selected, setSelected] = useState<MethodId>("Turkey");

  useEffect(() => {
    const saved = localStorage.getItem("knm-prayer-method") as MethodId | null;
    if (saved && (CALCULATION_METHODS as readonly string[]).includes(saved)) {
      setSelected(saved);
    }
  }, []);

  function handleContinue() {
    localStorage.setItem("knm-prayer-method", selected);
    localStorage.setItem("knm-onboarding-done", "true");
    onDone();
  }

  return (
    <div className="flex flex-col gap-5 flex-1 w-full max-w-sm mx-auto px-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">{t("prayerMethodTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("prayerMethodSubtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {CALCULATION_METHODS.map((id) => (
          <button
            key={id}
            onClick={() => setSelected(id)}
            className={cn(
              "relative flex flex-col items-start px-3 py-3 rounded-2xl border text-xs font-medium text-left transition-all",
              selected === id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            <span className="leading-snug">{t(`methods.${id}`)}</span>
            {selected === id && (
              <Check className="absolute top-2 right-2 w-3.5 h-3.5 shrink-0" />
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-2 pt-2 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t("back")}
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {t("continue")} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main flow ─────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

export default function OnboardingFlow() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | null>(null);
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const saved = sessionStorage.getItem("knm-onboarding-step");
    if (saved) {
      sessionStorage.removeItem("knm-onboarding-step");
      const n = Number(saved);
      setStep((n >= 1 && n <= 4 ? n : isSignedIn ? 2 : 1) as 1 | 2 | 3 | 4);
      return;
    }

    if (!isSignedIn) {
      setStep(1);
    } else {
      const done = localStorage.getItem("knm-onboarding-done");
      if (done) {
        router.replace("/");
      } else {
        setStep(2);
      }
    }
  }, [isLoaded, isSignedIn, router]);

  if (step === null) return <div className="min-h-svh" />;

  return (
    <div className="min-h-svh flex flex-col items-center justify-center py-10">
      <div className="w-full max-w-sm flex flex-col min-h-[600px]">
        <div className="flex items-center justify-between px-6 mb-8">
          <Dots step={step} total={TOTAL_STEPS} />
          <span className="text-xs text-muted-foreground tabular-nums">{step} / {TOTAL_STEPS}</span>
        </div>

        {step === 1 && <StepSignIn />}
        {step === 2 && <StepWelcome onNext={() => setStep(3)} />}
        {step === 3 && <StepPreferences onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <StepPrayerMethod onDone={() => router.replace("/")} onBack={() => setStep(3)} />}
      </div>
    </div>
  );
}
