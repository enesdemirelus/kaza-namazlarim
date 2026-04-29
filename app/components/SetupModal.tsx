"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { Sun, Moon, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { saveUserSettings } from "@/app/actions/settings";

// ── Constants ──────────────────────────────────────────────────────────────────

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

// ── SetupModal ─────────────────────────────────────────────────────────────────

export default function SetupModal({ defaultOpen }: { defaultOpen: boolean }) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const { resolvedTheme, setTheme } = useTheme();

  const [open, setOpen] = useState(defaultOpen);
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [accent, setAccentState] = useState<AccentId>("green");
  const [method, setMethod] = useState<MethodId>("Turkey");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const savedAccent = localStorage.getItem("accent-color") as AccentId | null;
    if (savedAccent && ACCENT_COLORS.some((c) => c.id === savedAccent)) {
      setAccentState(savedAccent);
    }

    const savedMethod = localStorage.getItem("knm-prayer-method") as MethodId | null;
    if (savedMethod && (CALCULATION_METHODS as readonly string[]).includes(savedMethod)) {
      setMethod(savedMethod);
    }
  }, []);

  // Keep theme state in sync with resolvedTheme once it's available
  useEffect(() => {
    if (resolvedTheme === "light" || resolvedTheme === "dark") {
      setThemeState(resolvedTheme);
    }
  }, [resolvedTheme]);

  function handleTheme(value: "light" | "dark") {
    setThemeState(value);
    setTheme(value);
  }

  function handleAccent(id: AccentId) {
    setAccentState(id);
    document.documentElement.setAttribute("data-color", id);
  }

  async function handleSave() {
    setSaving(true);

    // Apply theme
    setTheme(theme);

    // Apply accent
    localStorage.setItem("accent-color", accent);
    document.documentElement.setAttribute("data-color", accent);

    // Apply prayer method
    localStorage.setItem("knm-prayer-method", method);

    // Persist to server
    try {
      await saveUserSettings({ theme, accentColor: accent, prayerMethod: method, locale, onboardingDone: true });
    } catch {
      // Non-fatal — local settings already applied
    }

    setSaving(false);
    setOpen(false);
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold tracking-tight">
            {t("setup.welcome")}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t("setup.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-1">
          {/* Theme */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("theme")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "light" as const, Icon: Sun,  label: t("light") },
                { value: "dark"  as const, Icon: Moon, label: t("dark")  },
              ]).map(({ value, Icon, label }) => (
                <button
                  key={value}
                  onClick={() => handleTheme(value)}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 rounded-2xl border text-sm font-semibold transition-all",
                    theme === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Accent colour */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("accentColour")}
            </p>
            <div className="grid grid-cols-6 gap-2">
              {ACCENT_COLORS.map(({ id, hue }) => (
                <button
                  key={id}
                  onClick={() => handleAccent(id)}
                  className="flex items-center justify-center"
                >
                  <span
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                      accent === id
                        ? "ring-2 ring-offset-2 ring-foreground/30 scale-110"
                        : "hover:scale-105",
                    )}
                    style={{ backgroundColor: swatchColor(hue) }}
                  >
                    {accent === id && (
                      <Check className="w-4 h-4 text-white drop-shadow" strokeWidth={2.5} />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Prayer method */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("prayerMethodTitle")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {CALCULATION_METHODS.map((id) => (
                <button
                  key={id}
                  onClick={() => setMethod(id)}
                  className={cn(
                    "relative h-12 flex items-center justify-center px-2.5 rounded-xl border text-center transition-all",
                    method === id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:bg-muted",
                  )}
                >
                  <span className="text-xs font-bold leading-snug line-clamp-2 w-full text-center px-1">{t(`methods.${id}`)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-2 w-full flex items-center justify-center py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {t("setup.startTracking")}
        </button>
      </DialogContent>
    </Dialog>
  );
}
