"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Sunrise, Sun, Sunset, Moon, ChevronLeft, ChevronRight } from "lucide-react";

type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
type ViewMode = "all" | "monthly" | "yearly";

const PRAYERS: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const ICONS: Record<PrayerKey, React.ElementType> = {
  fajr: Sunrise,
  dhuhr: Sun,
  asr: Sun,
  maghrib: Sunset,
  isha: Moon,
};

// ── Mock data ────────────────────────────────────────────────────────────────
type MissedData = Record<number, Record<number, Record<PrayerKey, number>>>;

const MOCK: MissedData = {
  2025: {
    0:  { fajr: 8,  dhuhr: 4, asr: 6,  maghrib: 2, isha: 5  },
    1:  { fajr: 6,  dhuhr: 3, asr: 4,  maghrib: 1, isha: 3  },
    2:  { fajr: 9,  dhuhr: 5, asr: 7,  maghrib: 3, isha: 6  },
    3:  { fajr: 7,  dhuhr: 2, asr: 5,  maghrib: 2, isha: 4  },
    4:  { fajr: 10, dhuhr: 6, asr: 8,  maghrib: 4, isha: 7  },
    5:  { fajr: 5,  dhuhr: 1, asr: 3,  maghrib: 1, isha: 2  },
    6:  { fajr: 8,  dhuhr: 4, asr: 6,  maghrib: 3, isha: 5  },
    7:  { fajr: 6,  dhuhr: 3, asr: 4,  maghrib: 2, isha: 3  },
    8:  { fajr: 9,  dhuhr: 5, asr: 7,  maghrib: 2, isha: 6  },
    9:  { fajr: 7,  dhuhr: 2, asr: 5,  maghrib: 1, isha: 4  },
    10: { fajr: 10, dhuhr: 6, asr: 8,  maghrib: 4, isha: 7  },
    11: { fajr: 5,  dhuhr: 1, asr: 3,  maghrib: 1, isha: 2  },
  },
  2026: {
    0:  { fajr: 6,  dhuhr: 3, asr: 5,  maghrib: 2, isha: 4  },
    1:  { fajr: 4,  dhuhr: 2, asr: 3,  maghrib: 1, isha: 2  },
    2:  { fajr: 7,  dhuhr: 4, asr: 6,  maghrib: 2, isha: 5  },
    3:  { fajr: 5,  dhuhr: 1, asr: 4,  maghrib: 1, isha: 3  },
  },
};

const EMPTY: Record<PrayerKey, number> = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

function sumPrayers(data: Record<PrayerKey, number>): number {
  return PRAYERS.reduce((s, p) => s + (data[p] ?? 0), 0);
}

function aggregateAll(): Record<PrayerKey, number> {
  return PRAYERS.reduce((acc, p) => {
    acc[p] = Object.values(MOCK).flatMap(Object.values).reduce((s, m) => s + (m[p] ?? 0), 0);
    return acc;
  }, {} as Record<PrayerKey, number>);
}

function aggregateYear(year: number): Record<PrayerKey, number> {
  const months = MOCK[year] ?? {};
  return PRAYERS.reduce((acc, p) => {
    acc[p] = Object.values(months).reduce((s, m) => s + (m[p] ?? 0), 0);
    return acc;
  }, {} as Record<PrayerKey, number>);
}

// ── Period navigator ─────────────────────────────────────────────────────────

function PeriodNav({
  label, onPrev, onNext, canPrev, canNext,
}: {
  label: string; onPrev: () => void; onNext: () => void; canPrev: boolean; canNext: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={onPrev}
        disabled={!canPrev}
        className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-primary/10 disabled:opacity-25 transition-colors"
      >
        <ChevronLeft className="w-3 h-3 text-primary" />
      </button>
      <span className="text-[11px] font-medium text-muted-foreground min-w-[68px] text-center select-none tabular-nums">
        {label}
      </span>
      <button
        onClick={onNext}
        disabled={!canNext}
        className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-primary/10 disabled:opacity-25 transition-colors"
      >
        <ChevronRight className="w-3 h-3 text-primary" />
      </button>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

const now = new Date();
const AVAILABLE_YEARS = Object.keys(MOCK).map(Number).sort();

export default function MissedPrayersBox() {
  const t = useTranslations("times");
  const tm = useTranslations("missed");

  const [view, setView] = useState<ViewMode>("all");
  const [month, setMonth] = useState(now.getMonth());
  const [monthYear, setMonthYear] = useState(now.getFullYear());
  const [year, setYear] = useState(now.getFullYear());

  const counts =
    view === "all"
      ? aggregateAll()
      : view === "yearly"
        ? aggregateYear(year)
        : (MOCK[monthYear]?.[month] ?? EMPTY);

  const total = sumPrayers(counts);

  const monthLabel = new Date(monthYear, month, 1).toLocaleDateString(undefined, {
    month: "short", year: "numeric",
  });

  const canPrevMonth = !(monthYear === AVAILABLE_YEARS[0] && month === 0);
  const canNextMonth =
    monthYear < now.getFullYear() ||
    (monthYear === now.getFullYear() && month < now.getMonth());
  const canPrevYear = year > AVAILABLE_YEARS[0];
  const canNextYear = year < now.getFullYear();

  function prevMonth() {
    if (month === 0) { setMonth(11); setMonthYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setMonthYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const views: ViewMode[] = ["all", "monthly", "yearly"];

  return (
    <div className="rounded-3xl border bg-card shadow-(--shadow-card) p-4 md:p-5 flex-1 min-h-0 flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-start justify-between shrink-0">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">{tm("title")}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{tm("subtitle")}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-bold tabular-nums leading-none text-primary">{total}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">{tm("total")}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between shrink-0">
        {/* Segmented toggle */}
        <div className="flex gap-0.5 bg-muted rounded-xl p-0.5">
          {views.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-2.5 py-1 rounded-[10px] text-xs font-medium transition-all",
                view === v
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tm(v)}
            </button>
          ))}
        </div>

        {/* Period nav — hidden on "all" */}
        {view === "monthly" && (
          <PeriodNav
            label={monthLabel}
            onPrev={prevMonth}
            onNext={nextMonth}
            canPrev={canPrevMonth}
            canNext={canNextMonth}
          />
        )}
        {view === "yearly" && (
          <PeriodNav
            label={String(year)}
            onPrev={() => setYear((y) => y - 1)}
            onNext={() => setYear((y) => y + 1)}
            canPrev={canPrevYear}
            canNext={canNextYear}
          />
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-border shrink-0" />

      {/* Prayer stats — 5 equal columns, number-centred */}
      <div className="flex flex-1 min-h-0 items-stretch gap-1">
        {PRAYERS.map((key) => {
          const Icon = ICONS[key];
          const count = counts[key] ?? 0;
          return (
            <div
              key={key}
              className="flex flex-col flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary/10 dark:bg-primary/15 py-2"
            >
              <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xl md:text-2xl font-bold tabular-nums leading-none text-primary">
                {count}
              </span>
              <span className="text-[10px] text-muted-foreground leading-none text-center px-1">
                {t(key)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
