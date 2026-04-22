"use client";

import { useEffect, useState } from "react";
import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";
import { useLocale, useTranslations } from "next-intl";

export default function PrayerTimesWidget() {
  const t = useTranslations("times");
  const locale = useLocale();
  const [times, setTimes] = useState<PrayerTimes | null>(null);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: locale === "en",
    });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const pt = new PrayerTimes(
        new Coordinates(coords.latitude, coords.longitude),
        new Date(),
        CalculationMethod.NorthAmerica(),
      );
      setTimes(pt);
    });
  }, []);

  return (
    <div className="rounded-3xl border bg-card shadow-[var(--shadow-card)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] transition-all duration-200 p-6 h-full">
      {/*
      {!times && <p>Loading...</p>}
      {times && (
        <ul>
          <li>{t("fajr")}: {formatTime(times.fajr)}</li>
          <li>{t("sunrise")}: {formatTime(times.sunrise)}</li>
          <li>{t("dhuhr")}: {formatTime(times.dhuhr)}</li>
          <li>{t("asr")}: {formatTime(times.asr)}</li>
          <li>{t("maghrib")}: {formatTime(times.maghrib)}</li>
          <li>{t("isha")}: {formatTime(times.isha)}</li>
        </ul>
      )}
      */}
    </div>
  );
}
