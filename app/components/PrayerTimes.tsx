"use client";

import { useEffect, useState } from "react";
import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Sunrise, Sun, Sunset, Moon, Clock } from "lucide-react";
import PrayerTimesInform from "./PrayerTimesInform";

type PrayerKey = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

const PRAYERS: PrayerKey[] = [
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

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
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [now, setNow] = useState(new Date());

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: locale === "en",
    });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setTimes(
        new PrayerTimes(
          new Coordinates(coords.latitude, coords.longitude),
          new Date(),
          CalculationMethod.Turkey(),
        ),
      );
    });
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
    <div className="rounded-3xl border bg-card shadow-(--shadow-card) p-4 md:p-6 md:h-full md:min-h-0">

      {/* ── MOBILE: compact full-width card ── */}
      <div className="md:hidden flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-semibold tracking-tight">{t("title")}</h2>
              <PrayerTimesInform />
            </div>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{today}</p>
          </div>
          {times && nextPrayer && nextPrayer !== "none" && msUntilNext !== null && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-muted-foreground">{t("nextPrayer")}</span>
              <span className="text-sm font-semibold text-primary tabular-nums">
                {formatCountdown(msUntilNext, locale)}
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Prayer grid — 2 columns */}
        {!times && (
          <div className="grid grid-cols-2 gap-2 animate-pulse">
            {PRAYERS.map((key) => (
              <div key={key} className="h-10 rounded-xl bg-muted" />
            ))}
          </div>
        )}
        {times && (
          <div className="grid grid-cols-2 gap-2">
            {PRAYERS.map((key) => {
              const Icon = ICONS[key];
              const isCurrent = currentPrayer === key;
              const isNext = nextPrayer === key;
              const isSunrise = key === "sunrise";
              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl",
                    isCurrent && "bg-primary text-primary-foreground",
                    !isCurrent && isNext && "bg-muted",
                    isSunrise && !isCurrent && "opacity-60",
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5 shrink-0", isCurrent ? "text-primary-foreground" : "text-muted-foreground")} />
                  <div className="flex flex-col min-w-0">
                    <span className={cn("text-xs font-medium leading-tight", isCurrent ? "text-primary-foreground" : "text-foreground")}>
                      {t(key)}
                    </span>
                    <span className={cn("text-xs tabular-nums leading-tight", isCurrent ? "text-primary-foreground" : "text-muted-foreground")}>
                      {formatTime(times[key])}
                    </span>
                  </div>
                  {isCurrent && (
                    <span className="ml-auto text-[9px] font-bold uppercase bg-primary-foreground/20 text-primary-foreground rounded-full px-1.5 py-0.5 leading-tight shrink-0">
                      {t("now")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DESKTOP: full vertical layout ── */}
      <div className="hidden md:flex flex-col h-full min-h-0 gap-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
            <PrayerTimesInform />
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
      {times && nextPrayer && nextPrayer !== "none" && msUntilNext !== null && (
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
                      isCurrent
                        ? "bg-primary-foreground/15"
                        : "bg-muted",
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
                  {isCurrent && (
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

      </div>{/* end desktop layout */}
    </div>
  );
}
