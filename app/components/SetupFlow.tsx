"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { Sun, Moon, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveUserSettings } from "@/app/actions/settings";
import { useRouter } from "@/i18n/navigation";

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

const CALCULATION_METHODS = [
  "Turkey", "NorthAmerica", "MuslimWorldLeague", "Egyptian",
  "Karachi", "UmmAlQura", "Dubai", "Kuwait", "Qatar",
  "Singapore", "Tehran", "MoonsightingCommittee",
] as const;

type MethodId = (typeof CALCULATION_METHODS)[number];

function swatchColor(hue: number) {
  return `oklch(0.527 0.16 ${hue})`;
}

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

function StepPreferences({ onNext }: { onNext: () => void }) {
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
      sessionStorage.setItem("knm-setup-step", "1");
      window.location.replace(`/${next}/onboarding/setup`);
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
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {t("continue")} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StepPrayerMethod({
  onBack,
  onDone,
}: {
  onBack: () => void;
  onDone: (method: MethodId) => Promise<void>;
}) {
  const t = useTranslations("onboarding");
  const [selected, setSelected] = useState<MethodId>("Turkey");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("knm-prayer-method") as MethodId | null;
    if (saved && (CALCULATION_METHODS as readonly string[]).includes(saved)) {
      setSelected(saved);
    }
  }, []);

  async function handleDone() {
    setSaving(true);
    localStorage.setItem("knm-prayer-method", selected);
    await onDone(selected);
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
            {selected === id && <Check className="absolute top-2 right-2 w-3.5 h-3.5 shrink-0" />}
          </button>
        ))}
      </div>

      <div className="flex gap-2 pt-2 shrink-0">
        <button
          onClick={onBack}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" /> {t("back")}
        </button>
        <button
          onClick={handleDone}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {saving ? t("continue") + "…" : t("continue")} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const TOTAL_STEPS = 2;

export default function SetupFlow() {
  const [step, setStep] = useState<1 | 2 | null>(null);
  const { resolvedTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();

  useEffect(() => {
    const saved = sessionStorage.getItem("knm-setup-step");
    if (saved) {
      sessionStorage.removeItem("knm-setup-step");
      setStep(Number(saved) as 1 | 2);
    } else {
      setStep(1);
    }
  }, []);

  async function handleDone(prayerMethod: MethodId) {
    await saveUserSettings({
      locale,
      theme: resolvedTheme ?? "light",
      accentColor: localStorage.getItem("accent-color") ?? "green",
      prayerMethod,
    });
    router.replace("/");
  }

  if (step === null) return null;

  return (
    <div className="min-h-svh flex flex-col items-center justify-center py-10">
      <div className="w-full max-w-sm flex flex-col min-h-[600px]">
        <div className="flex items-center justify-between px-6 mb-8">
          <Dots step={step} total={TOTAL_STEPS} />
          <span className="text-xs text-muted-foreground tabular-nums">{step} / {TOTAL_STEPS}</span>
        </div>
        {step === 1 && <StepPreferences onNext={() => setStep(2)} />}
        {step === 2 && <StepPrayerMethod onBack={() => setStep(1)} onDone={handleDone} />}
      </div>
    </div>
  );
}
