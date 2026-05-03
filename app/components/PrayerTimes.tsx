"use client";

import { useEffect, useMemo, useState } from "react";
import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Sunrise, Sun, Sunset, Moon, Clock, SlidersHorizontal, MapPin, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "radix-ui";

type PrayerKey = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

const PRAYERS: PrayerKey[] = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

const COORDS_STORAGE_KEY = "knm-prayer-coords";
const LOCATION_STORAGE_KEY = "knm-prayer-location";

function readStoredCoords(): Coordinates | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(COORDS_STORAGE_KEY);
    if (!raw) return null;
    const { latitude, longitude } = JSON.parse(raw) as { latitude: number; longitude: number };
    if (typeof latitude !== "number" || typeof longitude !== "number") return null;
    return new Coordinates(latitude, longitude);
  } catch {
    return null;
  }
}

function storeCoords(coords: Coordinates) {
  sessionStorage.setItem(COORDS_STORAGE_KEY, JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude }));
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

function DesktopSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0 gap-1.5 animate-pulse">
      {PRAYERS.map((key) => (
        <div key={key} className="flex-1 rounded-2xl bg-muted" />
      ))}
    </div>
  );
}

function PrayerList({
  times,
  currentPrayer,
  nextPrayer,
  formatTime,
  t,
}: {
  times: PrayerTimes;
  currentPrayer: string | null;
  nextPrayer: string | null;
  formatTime: (d: Date) => string;
  t: ReturnType<typeof useTranslations<"times">>;
}) {
  return (
    <ul className="flex flex-col gap-1.5">
      {PRAYERS.map((key) => {
        const Icon = ICONS[key];
        const isCurrent = currentPrayer === key;
        const isNext = nextPrayer === key;
        const isSunrise = key === "sunrise";

        return (
          <li
            key={key}
            className={cn(
              "flex items-center justify-between px-4 py-3 rounded-2xl",
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
                    isCurrent ? "text-primary-foreground" : "text-muted-foreground",
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isCurrent ? "text-primary-foreground" : isSunrise ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {t(key)}
              </span>
              {isCurrent && !isSunrise && (
                <span className="text-[10px] font-semibold tracking-wide uppercase bg-primary-foreground/20 text-primary-foreground rounded-full px-2 py-0.5 leading-tight">
                  {t("now")}
                </span>
              )}
            </div>
            <span
              className={cn(
                "text-sm tabular-nums",
                isCurrent ? "text-primary-foreground font-semibold" : "text-muted-foreground",
              )}
            >
              {formatTime(times[key])}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function PrayerTimesWidget() {
  const t = useTranslations("times");
  const locale = useLocale();
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [locationName, setLocationName] = useState<string | null>(() =>
    typeof window !== "undefined" ? sessionStorage.getItem(LOCATION_STORAGE_KEY) : null,
  );
  const [now, setNow] = useState(new Date());
  const [prayerMethod, setPrayerMethod] = useState("Turkey");
  const [modalOpen, setModalOpen] = useState(false);

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

  const tomorrowFajr = useMemo(() => {
    if (!coords) return null;
    const tomorrow = new Date(y, mo, d + 1);
    const methodFn = (CalculationMethod as Record<string, (() => unknown) | undefined>)[prayerMethod];
    const params = typeof methodFn === "function" ? methodFn() : CalculationMethod.Turkey();
    return new PrayerTimes(coords, tomorrow, params as ConstructorParameters<typeof PrayerTimes>[2]).fajr;
  }, [coords, y, mo, d, prayerMethod]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: locale === "en" });

  useEffect(() => {
    const saved = localStorage.getItem("knm-prayer-method");
    if (saved) setPrayerMethod(saved);
  }, []);

  useEffect(() => {
    async function resolveLocation(lat: number, lon: number) {
      if (sessionStorage.getItem(LOCATION_STORAGE_KEY)) return;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
          { headers: { "Accept-Language": "en" } },
        );
        const json = await res.json();
        const addr = json.address ?? {};
        const city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? "";
        const country = (addr.country_code ?? "").toUpperCase();
        const name = [city, country].filter(Boolean).join(", ");
        if (name) {
          sessionStorage.setItem(LOCATION_STORAGE_KEY, name);
          setLocationName(name);
        }
      } catch { /* non-fatal */ }
    }

    const stored = readStoredCoords();
    if (stored) {
      setCoords(stored);
      resolveLocation(stored.latitude, stored.longitude);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        const next = new Coordinates(c.latitude, c.longitude);
        storeCoords(next);
        setCoords(next);
        resolveLocation(c.latitude, c.longitude);
      },
      undefined,
      { enableHighAccuracy: false, maximumAge: 10 * 60 * 1000, timeout: 10_000 },
    );
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(id);
  }, []);

  const today = now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });

  const currentPrayer = times?.currentPrayer(now) ?? null;
  const rawNextPrayer = times?.nextPrayer(now) ?? null;
  const isAfterIsha = rawNextPrayer === "none";
  const nextPrayer = isAfterIsha ? "fajr" : rawNextPrayer;
  const nextTime = isAfterIsha ? tomorrowFajr : (nextPrayer ? (times?.timeForPrayer(nextPrayer) ?? null) : null);
  const msUntilNext = nextTime !== null ? nextTime!.getTime() - now.getTime() : null;

  return (
    <>
      <div className="rounded-3xl border bg-card shadow-(--shadow-card) p-3 shrink-0 md:p-6 md:h-full md:min-h-0">

        {/* ── MOBILE: tappable compact card ── */}
        <button
          onClick={() => setModalOpen(true)}
          className="md:hidden w-full text-left"
        >
          {/* Main row */}
          <div className="flex items-center gap-3">
            {/* Current prayer */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {!times ? (
                <>
                  <div className="w-9 h-9 rounded-xl bg-muted animate-pulse shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-20 rounded-md bg-muted animate-pulse" />
                    <div className="h-3 w-12 rounded-md bg-muted animate-pulse" />
                  </div>
                </>
              ) : currentPrayer && currentPrayer !== "none" ? (
                (() => {
                  const Icon = ICONS[currentPrayer as PrayerKey];
                  const isSunrise = currentPrayer === "sunrise";
                  return (
                    <>
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                        isSunrise ? "bg-muted" : "bg-primary",
                      )}>
                        <Icon className={cn("w-4 h-4", isSunrise ? "text-muted-foreground" : "text-primary-foreground")} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={cn("text-sm font-bold leading-tight truncate", isSunrise && "text-muted-foreground")}>
                            {t(currentPrayer as PrayerKey)}
                          </span>
                          {!isSunrise && (
                            <span className="text-[9px] font-bold uppercase bg-primary/15 text-primary rounded-full px-1.5 py-0.5 shrink-0 leading-tight">
                              {t("now")}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatTime(times[currentPrayer as PrayerKey])}
                        </span>
                      </div>
                    </>
                  );
                })()
              ) : null}
            </div>

            {/* Divider */}
            <div className="w-px h-9 bg-border shrink-0" />

            {/* Next prayer countdown */}
            {!times ? (
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="h-2.5 w-10 rounded bg-muted animate-pulse" />
                <div className="h-5 w-16 rounded bg-muted animate-pulse" />
                <div className="h-2.5 w-8 rounded bg-muted animate-pulse" />
              </div>
            ) : nextPrayer && nextPrayer !== "none" && msUntilNext !== null ? (
              <div className="flex flex-col items-end shrink-0">
                <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground leading-tight mb-1">
                  {t("nextPrayer")}
                </span>
                <span className="text-sm font-bold text-primary tabular-nums leading-tight mb-0.5">
                  {formatCountdown(msUntilNext, locale)}
                </span>
                <span className="text-xs text-muted-foreground leading-tight">
                  {t(nextPrayer as PrayerKey)}
                </span>
              </div>
            ) : null}
          </div>

          {/* Bottom row: date + location */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
            <span className="text-[10px] text-muted-foreground capitalize">{today}</span>
            {locationName ? (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="w-2.5 h-2.5 shrink-0" />
                <span>{locationName}</span>
              </div>
            ) : (
              <div className="w-16 h-2.5 rounded bg-muted animate-pulse" />
            )}
          </div>
        </button>

        {/* ── DESKTOP: full vertical layout ── */}
        <div className="hidden md:flex flex-col h-full min-h-0 gap-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
                <Link
                  href="/settings"
                  className="flex items-center gap-1 text-muted-foreground/60 hover:text-primary transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="text-sm text-muted-foreground capitalize mt-0.5">{today}</p>
              {locationName && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{locationName}</span>
                </div>
              )}
            </div>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
          </div>

          {/* Next prayer countdown */}
          {times && nextPrayer && nextPrayer !== "none" && msUntilNext !== null && (
            <div className="flex items-center justify-between rounded-2xl bg-primary/10 dark:bg-primary/15 px-4 py-3.5">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t("nextPrayer")}</p>
                <p className="text-sm font-semibold">{t(nextPrayer as PrayerKey)}</p>
              </div>
              <span className="text-primary font-semibold text-sm tabular-nums">
                {formatCountdown(msUntilNext, locale)}
              </span>
            </div>
          )}

          <div className="h-px bg-border" />

          {!times && <DesktopSkeleton />}

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
                        <Icon className={cn("w-4 h-4", isCurrent ? "text-primary-foreground" : "text-muted-foreground")} />
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isCurrent ? "text-primary-foreground" : isSunrise ? "text-muted-foreground" : "text-foreground",
                        )}
                      >
                        {t(key)}
                      </span>
                      {isCurrent && !isSunrise && (
                        <span className="text-[10px] font-semibold tracking-wide uppercase bg-primary-foreground/20 text-primary-foreground rounded-full px-2 py-0.5 leading-tight">
                          {t("now")}
                        </span>
                      )}
                    </div>
                    <span className={cn("text-sm tabular-nums", isCurrent ? "text-primary-foreground font-semibold" : "text-muted-foreground")}>
                      {formatTime(times[key])}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── MOBILE MODAL ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="md:hidden p-0 overflow-hidden gap-0">
          <VisuallyHidden.Root><DialogTitle>{t("title")}</DialogTitle></VisuallyHidden.Root>
          {/* Header */}
          <div className="flex items-start justify-between p-5 pb-4">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
                <Link
                  href="/settings"
                  onClick={() => setModalOpen(false)}
                  className="text-muted-foreground/60 hover:text-primary transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="text-sm text-muted-foreground capitalize mt-0.5">{today}</p>
              {locationName && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{locationName}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setModalOpen(false)}
              className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Next prayer countdown */}
          {times && nextPrayer && nextPrayer !== "none" && msUntilNext !== null && (
            <div className="mx-5 mb-4 flex items-center justify-between rounded-2xl bg-primary/10 dark:bg-primary/15 px-4 py-3.5">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t("nextPrayer")}</p>
                <p className="text-sm font-semibold">{t(nextPrayer as PrayerKey)}</p>
              </div>
              <span className="text-primary font-semibold text-sm tabular-nums">
                {formatCountdown(msUntilNext, locale)}
              </span>
            </div>
          )}

          <div className="h-px bg-border mx-5" />

          {/* Prayer list */}
          <div className="p-5 pt-4">
            {!times ? (
              <div className="flex flex-col gap-2 animate-pulse">
                {PRAYERS.map((key) => (
                  <div key={key} className="h-14 rounded-2xl bg-muted" />
                ))}
              </div>
            ) : (
              <PrayerList
                times={times}
                currentPrayer={currentPrayer}
                nextPrayer={nextPrayer}
                formatTime={formatTime}
                t={t}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
