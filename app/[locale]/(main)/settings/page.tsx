"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useUser, useClerk } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Sun, Moon, Check, LogOut, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveUserSettings } from "@/app/actions/settings";

const CALCULATION_METHODS = [
  "Turkey", "NorthAmerica", "MuslimWorldLeague", "Egyptian",
  "Karachi", "UmmAlQura", "Dubai", "Kuwait", "Qatar",
  "Singapore", "Tehran", "MoonsightingCommittee",
] as const;

type MethodId = (typeof CALCULATION_METHODS)[number];

const THEME_VALUES = [
  { value: "light", Icon: Sun  },
  { value: "dark",  Icon: Moon },
] as const;

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

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tm = useTranslations("onboarding");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [accent, setAccentState] = useState<AccentId>("green");
  const [prayerMethod, setPrayerMethodState] = useState<MethodId>("Turkey");
  const { user } = useUser();
  const { openUserProfile, signOut } = useClerk();

  useEffect(() => {
    setMounted(true);
    setAccentState((localStorage.getItem("accent-color") ?? "green") as AccentId);
    setPrayerMethodState((localStorage.getItem("knm-prayer-method") ?? "Turkey") as MethodId);
  }, []);

  function setAccent(id: AccentId) {
    localStorage.setItem("accent-color", id);
    document.documentElement.setAttribute("data-color", id);
    setAccentState(id);
    saveUserSettings({ accentColor: id }).catch(console.error);
  }

  function setPrayerMethod(id: MethodId) {
    localStorage.setItem("knm-prayer-method", id);
    setPrayerMethodState(id);
    saveUserSettings({ prayerMethod: id }).catch(console.error);
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">

        {/* Account */}
        <div className="rounded-3xl border bg-card shadow-(--shadow-card) p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">{t("accountTitle")}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t("accountSubtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={user.fullName ?? ""} className="w-10 h-10 rounded-2xl object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold text-sm">
                {user?.firstName?.[0] ?? "?"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight truncate">{user?.fullName ?? "—"}</p>
              <p className="text-xs text-muted-foreground leading-tight truncate mt-0.5">
                {user?.primaryEmailAddress?.emailAddress ?? ""}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openUserProfile()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors cursor-pointer"
            >
              <UserCog className="w-4 h-4" /> {t("manageAccount")}
            </button>
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-xs font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> {t("signOut")}
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="rounded-3xl border bg-card shadow-(--shadow-card) p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">{t("appearanceTitle")}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t("appearanceSubtitle")}</p>
          </div>
          <div className="flex gap-2">
            {THEME_VALUES.map(({ value, Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all cursor-pointer",
                  mounted && resolvedTheme === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{t(value)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Accent colour — flex-col so swatch grid can flex-1 to match prayer card height */}
        <div className="rounded-3xl border bg-card shadow-(--shadow-card) p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">{t("accentTitle")}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t("accentSubtitle")}</p>
          </div>
          <div className="flex-1 grid grid-cols-4 gap-x-2 gap-y-0 content-between">
            {ACCENT_COLORS.map(({ id, hue }) => {
              const isActive = accent === id;
              return (
                <button
                  key={id}
                  onClick={() => setAccent(id)}
                  className="flex flex-col items-center gap-1.5 cursor-pointer group"
                >
                  <span
                    className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center transition-all ring-offset-background",
                      isActive ? "ring-2 ring-offset-2 ring-foreground/30 scale-110" : "group-hover:scale-105",
                    )}
                    style={{ backgroundColor: swatchColor(hue) }}
                  >
                    {isActive && <Check className="w-4 h-4 text-white drop-shadow" strokeWidth={2.5} />}
                  </span>
                  <span className={cn("text-[10px] font-medium leading-none", isActive ? "text-foreground" : "text-muted-foreground")}>
                    {t(id)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prayer times method */}
        <div className="rounded-3xl border bg-card shadow-(--shadow-card) p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">{t("prayerMethodTitle")}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t("prayerMethodSubtitle")}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {CALCULATION_METHODS.map((id) => (
              <button
                key={id}
                onClick={() => setPrayerMethod(id)}
                className={cn(
                  "relative flex items-center px-3 py-3 rounded-2xl border text-xs font-medium text-left transition-all",
                  prayerMethod === id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
                )}
              >
                <span className="leading-snug flex-1">{tm(`methods.${id}`)}</span>
                {prayerMethod === id && <Check className="w-3.5 h-3.5 shrink-0 ml-1" strokeWidth={2.5} />}
              </button>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
