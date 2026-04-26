"use client";

import { useEffect, useMemo, useState } from "react";
import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Sunrise, Sun, Sunset, Moon, Clock, SlidersHorizontal } from "lucide-react";
import { Link } from "@/i18n/navigation";

type PrayerKey = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

const PRAYERS: PrayerKey[] = [
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

const COORDS_STORAGE_KEY = "knm-prayer-coords";

function readStoredCoords(): Coordinates | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(COORDS_STORAGE_KEY);
    if (!raw) return null;
    const { latitude, longitude } = JSON.parse(raw) as {
      latitude: number;
      longitude: number;
    };
    if (typeof latitude !== "number" || typeof longitude !== "number")
      return null;
    return new Coordinates(latitude, longitude);
  } catch {
    return null;
  }
}

function storeCoords(coords: Coordinates) {
  sessionStorage.setItem(
    COORDS_STORAGE_KEY,
    JSON.stringify({
      latitude: coords.latitude,
      longitude: coords.longitude,
    }),
  );
}

const ICONS: Record<PrayerKey, React.ElementType> = {
  fajr: Sunrise,
  sunrise: Sun,
  dhuhr: Sun,
  asr: Sun,
  maghrib: Sunset,
  isha: Moon,
};

function formatCountdown(ms: number, locale: string): string {
  const totalSeconds = Math.floor(ms / 1_000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (locale === "tr") {
    if (hours > 0) return `${hours}s ${pad(minutes)}d ${pad(seconds)}sn`;
    return `${minutes}d ${pad(seconds)}sn`;
  }
  if (hours > 0) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  return `${minutes}m ${pad(seconds)}s`;
}

function Skeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0 gap-1.5 animate-pulse">
      {PRAYERS.map((key) => (
        <div key={key} className="flex-1 rounded-2xl bg-muted" />
      ))}
    </div>
  );
}

export default function PrayerTimesWidget() {
  const t = useTranslations("times");
  const locale = useLocale();
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [now, setNow] = useState(new Date());
  const [prayerMethod, setPrayerMethod] = useState("Turkey");

  const y = now.getFullYear();
  const mo = now.getMonth();
  const d = now.getDate();

  const times = useMemo(() => {
    if (!coords) return null;
    const day = new Date(y, mo, d);
    const methodFn = (CalculationMethod as Record<string, (() => unknown) | undefined>)[prayerMethod];
    const params = typeof methodFn === "function" ? methodFn() : CalculationMethod.Turkey();
    return new PrayerTimes(coords, day, params as ConstructorParameters<typeof PrayerTimes>[2]);
  }, [coords, y, mo, d, prayerMethod]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: locale === "en",
    });

  useEffect(() => {
    const saved = localStorage.getItem("knm-prayer-method");
    if (saved) setPrayerMethod(saved);
  }, []);

  useEffect(() => {
    const stored = readStoredCoords();
    if (stored) {
      setCoords(stored);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        const next = new Coordinates(c.latitude, c.longitude);
        storeCoords(next);
        setCoords(next);
      },
      undefined,
      {
        enableHighAccuracy: false,
        maximumAge: 10 * 60 * 1000,
        timeout: 10_000,
      },
    );
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(id);
  }, []);

  const today = now.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const currentPrayer = times?.currentPrayer(now) ?? null;
  const nextPrayer = times?.nextPrayer(now) ?? null;
  const nextTime =
    nextPrayer && nextPrayer !== "none"
      ? (times?.timeForPrayer(nextPrayer) ?? null)
      : null;
  const msUntilNext =
    nextTime !== null ? nextTime.getTime() - now.getTime() : null;

  return (
    <div className="rounded-3xl border bg-card shadow-(--shadow-card) p-4 shrink-0 md:shrink-0 md:p-6 md:h-full md:min-h-0">
      {/* ── MOBILE: compact single strip ── */}
      <div className="md:hidden flex items-center justify-between gap-3">
        {/* Current prayer */}
        <div className="flex items-center gap-3">
          {!times && (
            <div className="w-10 h-10 rounded-xl bg-muted animate-pulse shrink-0" />
          )}
          {times &&
            currentPrayer &&
            currentPrayer !== "none" &&
            (() => {
              const Icon = ICONS[currentPrayer as PrayerKey];
              return (
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
              );
            })()}
          <div>
            <p className="text-[11px] text-muted-foreground capitalize leading-none mb-1">
              {today}
            </p>
            {!times && (
              <div className="h-4 w-16 rounded bg-muted animate-pulse" />
            )}
            {times && currentPrayer && currentPrayer !== "none" && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold leading-none">
                  {t(currentPrayer as PrayerKey)}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums leading-none">
                  {formatTime(times[currentPrayer as PrayerKey])}
                </span>
                <span className="text-[9px] font-bold uppercase bg-primary/10 text-primary rounded-full px-1.5 py-0.5 leading-tight">
                  {t("now")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Next prayer */}
        {times &&
          nextPrayer &&
          nextPrayer !== "none" &&
          msUntilNext !== null && (
            <div className="flex flex-col items-end shrink-0">
              <span className="text-[10px] text-muted-foreground leading-none mb-1">
                {t("nextPrayer")}
              </span>
              <span className="text-sm font-bold text-primary tabular-nums leading-none">
                {formatCountdown(msUntilNext, locale)}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5 leading-none">
                {t(nextPrayer as PrayerKey)}
              </span>
            </div>
          )}
      </div>

      {/* ── DESKTOP: full vertical layout ── */}
      <div className="hidden md:flex flex-col h-full min-h-0 gap-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-semibold tracking-tight">
                {t("title")}
              </h2>
              <Link
                href="/settings"
                className="flex items-center gap-1 text-muted-foreground/60 hover:text-primary transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-sm text-muted-foreground capitalize mt-0.5">
              {today}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-primary" />
          </div>
        </div>

        {/* Next prayer countdown */}
        {times &&
          nextPrayer &&
          nextPrayer !== "none" &&
          msUntilNext !== null && (
            <div className="flex items-center justify-between rounded-2xl bg-primary/10 dark:bg-primary/15 px-4 py-3.5">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {t("nextPrayer")}
                </p>
                <p className="text-sm font-semibold">
                  {t(nextPrayer as PrayerKey)}
                </p>
              </div>
              <span className="text-primary font-semibold text-sm tabular-nums">
                {formatCountdown(msUntilNext, locale)}
              </span>
            </div>
          )}

        {/* Divider */}
        <div className="h-px bg-border" />

        {!times && <Skeleton />}

        {/* Prayer list */}
        {times && (
          <ul className="flex flex-col flex-1 min-h-0 gap-1.5">
            {PRAYERS.map((key) => {
              const Icon = ICONS[key];
              const isCurrent = currentPrayer === key;
              const isNext = nextPrayer === key;
              const isSunrise = key === "sunrise";

              return (
                <li
                  key={key}
                  className={cn(
                    "flex flex-1 items-center justify-between px-4 rounded-2xl",
                    isCurrent && "bg-primary text-primary-foreground",
                    !isCurrent && isNext && "bg-muted",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                        isCurrent ? "bg-primary-foreground/15" : "bg-muted",
                        isSunrise && !isCurrent && "opacity-60",
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4",
                          isCurrent
                            ? "text-primary-foreground"
                            : "text-muted-foreground",
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isCurrent
                          ? "text-primary-foreground"
                          : isSunrise
                            ? "text-muted-foreground"
                            : "text-foreground",
                      )}
                    >
                      {t(key)}
                    </span>
                    {isCurrent && key !== "sunrise" && (
                      <span className="text-[10px] font-semibold tracking-wide uppercase bg-primary-foreground/20 text-primary-foreground rounded-full px-2 py-0.5 leading-tight">
                        {t("now")}
                      </span>
                    )}
                  </div>

                  <span
                    className={cn(
                      "text-sm tabular-nums",
                      isCurrent
                        ? "text-primary-foreground font-semibold"
                        : isSunrise
                          ? "text-muted-foreground"
                          : "text-muted-foreground",
                    )}
                  >
                    {formatTime(times[key])}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {/* end desktop layout */}
    </div>
  );
}
