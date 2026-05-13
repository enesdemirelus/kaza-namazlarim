"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Check, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveUserSettings } from "@/app/actions/settings";

const ACCENT_COLORS = [
  { id: "green", hue: 150 },
  { id: "teal", hue: 182 },
  { id: "cyan", hue: 205 },
  { id: "blue", hue: 245 },
  { id: "indigo", hue: 268 },
  { id: "violet", hue: 285 },
  { id: "purple", hue: 305 },
  { id: "pink", hue: 328 },
  { id: "rose", hue: 12 },
  { id: "orange", hue: 45 },
  { id: "red", hue: 5 },
  { id: "amber", hue: 55 },
] as const;

type AccentId = (typeof ACCENT_COLORS)[number]["id"];

const CALCULATION_METHODS = [
  "Turkey",
  "NorthAmerica",
  "MuslimWorldLeague",
  "Egyptian",
  "Karachi",
  "UmmAlQura",
  "Dubai",
  "Kuwait",
  "Qatar",
  "Singapore",
  "Tehran",
  "MoonsightingCommittee",
] as const;

type MethodId = (typeof CALCULATION_METHODS)[number];

function isAccentId(value: string | null): value is AccentId {
  return ACCENT_COLORS.some((color) => color.id === value);
}

function isMethodId(value: string | null): value is MethodId {
  return CALCULATION_METHODS.some((method) => method === value);
}

function swatchColor(hue: number) {
  return `oklch(0.527 0.16 ${hue})`;
}

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem("theme") === "dark" ? "dark" : "light";
}

function getInitialAccent(): AccentId {
  if (typeof window === "undefined") return "green";
  const savedAccent = localStorage.getItem("accent-color");
  return isAccentId(savedAccent) ? savedAccent : "green";
}

function getInitialMethod(): MethodId {
  if (typeof window === "undefined") return "Turkey";
  const savedMethod = localStorage.getItem("knm-prayer-method");
  return isMethodId(savedMethod) ? savedMethod : "Turkey";
}

export default function SetupModal({ defaultOpen }: { defaultOpen: boolean }) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const { setTheme } = useTheme();

  const [open, setOpen] = useState(defaultOpen);
  const [theme, setThemeState] = useState<"light" | "dark">(getInitialTheme);
  const [accent, setAccentState] = useState<AccentId>(getInitialAccent);
  const [method, setMethod] = useState<MethodId>(getInitialMethod);
  const [saving, setSaving] = useState(false);

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

    setTheme(theme);
    localStorage.setItem("accent-color", accent);
    document.documentElement.setAttribute("data-color", accent);
    localStorage.setItem("knm-prayer-method", method);

    try {
      await saveUserSettings({
        locale,
        theme,
        accentColor: accent,
        prayerMethod: method,
        onboardingDone: true,
      });
      setOpen(false);
      window.dispatchEvent(new Event("knm-onboarding-done"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="overflow-hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold tracking-tight">
            {t("setup.welcome")}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t("setup.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-1 flex flex-col gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("theme")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "light" as const, Icon: Sun, label: t("light") },
                { value: "dark" as const, Icon: Moon, label: t("dark") },
              ].map(({ value, Icon, label }) => (
                <button
                  key={value}
                  onClick={() => handleTheme(value)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-2xl border py-2.5 text-sm font-semibold transition-all",
                    theme === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

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
                      "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                      accent === id
                        ? "scale-110 ring-2 ring-foreground/30 ring-offset-2 ring-offset-background"
                        : "hover:scale-105",
                    )}
                    style={{ backgroundColor: swatchColor(hue) }}
                  >
                    {accent === id && (
                      <Check
                        className="h-4 w-4 text-white drop-shadow"
                        strokeWidth={2.5}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

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
                    "relative flex h-12 items-center justify-center rounded-xl border px-2.5 text-center transition-all",
                    method === id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:bg-muted",
                  )}
                >
                  <span className="line-clamp-2 w-full px-1 text-center text-xs font-medium leading-snug">
                    {t(`methods.${id}`)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-2 flex w-full items-center justify-center rounded-2xl bg-primary py-3 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {t("setup.startTracking")}
        </button>
      </DialogContent>
    </Dialog>
  );
}
