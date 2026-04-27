"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Sunrise, Sun, Sunset, Moon,
  TrendingUp, Calendar, Sparkles,
  Target, Trophy, BarChart2,
} from "lucide-react";
import type { MissedPrayer, PrayerName } from "@/lib/types/database";

// ── Prayer config ────────────────────────────────────────────────────────────

type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

const PRAYER_ORDER: PrayerName[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const DB_TO_KEY: Record<PrayerName, PrayerKey> = {
  Fajr: "fajr",
  Dhuhr: "dhuhr",
  Asr: "asr",
  Maghrib: "maghrib",
  Isha: "isha",
};

const PRAYER_ICONS: Record<PrayerName, React.ElementType> = {
  Fajr: Sunrise,
  Dhuhr: Sun,
  Asr: Sun,
  Maghrib: Sunset,
  Isha: Moon,
};

// ── Stats computation ────────────────────────────────────────────────────────

type PrayerBucket = { total: number; missed: number; recovered: number };

type Stats = {
  total: number;
  missed: number;
  recovered: number;
  recoveryRate: number;
  byPrayer: Record<PrayerName, PrayerBucket>;
  monthly: Array<{ year: number; month: number; missed: number; recovered: number }>;
  byWeekday: number[];
  mostMissedPrayer: PrayerName | null;
  mostMissedWeekday: number | null;
  firstDate: string | null;
  lastDate: string | null;
  daysTracked: number;
  uniqueDays: number;
  avgPerWeek: number;
  monthsActive: number;
};

function computeStats(prayers: MissedPrayer[]): Stats {
  const stats: Stats = {
    total: 0, missed: 0, recovered: 0, recoveryRate: 0,
    byPrayer: {
      Fajr:    { total: 0, missed: 0, recovered: 0 },
      Dhuhr:   { total: 0, missed: 0, recovered: 0 },
      Asr:     { total: 0, missed: 0, recovered: 0 },
      Maghrib: { total: 0, missed: 0, recovered: 0 },
      Isha:    { total: 0, missed: 0, recovered: 0 },
    },
    monthly: [],
    byWeekday: [0, 0, 0, 0, 0, 0, 0],
    mostMissedPrayer: null,
    mostMissedWeekday: null,
    firstDate: null,
    lastDate: null,
    daysTracked: 0,
    uniqueDays: 0,
    avgPerWeek: 0,
    monthsActive: 0,
  };

  if (!prayers.length) return stats;
  stats.total = prayers.length;

  const monthBuckets = new Map<string, { year: number; month: number; missed: number; recovered: number }>();
  const datesSeen = new Set<string>();

  for (const p of prayers) {
    const bucket = stats.byPrayer[p.prayer_name];
    if (!bucket) continue;
    bucket.total++;
    if (p.is_recovered) {
      bucket.recovered++;
      stats.recovered++;
    } else {
      bucket.missed++;
      stats.missed++;
    }
    if (!p.date) continue;
    datesSeen.add(p.date);

    const [yStr, mStr, dStr] = p.date.split("-");
    const year = Number(yStr);
    const month = Number(mStr) - 1;
    const day = Number(dStr);
    const key = `${year}-${String(month).padStart(2, "0")}`;

    let mb = monthBuckets.get(key);
    if (!mb) {
      mb = { year, month, missed: 0, recovered: 0 };
      monthBuckets.set(key, mb);
    }
    if (p.is_recovered) mb.recovered++; else mb.missed++;

    const dow = new Date(year, month, day).getDay();
    const monIdx = (dow + 6) % 7;
    if (!p.is_recovered) stats.byWeekday[monIdx]++;

    if (!stats.firstDate || p.date < stats.firstDate) stats.firstDate = p.date;
    if (!stats.lastDate || p.date > stats.lastDate) stats.lastDate = p.date;
  }

  stats.recoveryRate = stats.total ? stats.recovered / stats.total : 0;
  stats.uniqueDays = datesSeen.size;
  stats.monthsActive = monthBuckets.size;

  let maxMissed = 0;
  for (const name of PRAYER_ORDER) {
    if (stats.byPrayer[name].missed > maxMissed) {
      maxMissed = stats.byPrayer[name].missed;
      stats.mostMissedPrayer = name;
    }
  }

  let maxWeekday = 0;
  for (let i = 0; i < 7; i++) {
    if (stats.byWeekday[i] > maxWeekday) {
      maxWeekday = stats.byWeekday[i];
      stats.mostMissedWeekday = i;
    }
  }

  if (stats.firstDate) {
    const first = new Date(stats.firstDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ms = today.getTime() - first.getTime();
    stats.daysTracked = Math.max(1, Math.floor(ms / 86400000) + 1);
  }
  if (stats.daysTracked > 0) stats.avgPerWeek = (stats.total / stats.daysTracked) * 7;

  const today = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const b = monthBuckets.get(key);
    stats.monthly.push({
      year: y, month: m,
      missed: b?.missed ?? 0,
      recovered: b?.recovered ?? 0,
    });
  }

  return stats;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString(locale, {
      day: "numeric", month: "short", year: "2-digit",
    });
  } catch { return iso; }
}

function monthShort(year: number, month: number, locale: string): string {
  try {
    return new Date(year, month, 1).toLocaleDateString(locale, { month: "short" });
  } catch { return String(month + 1); }
}

// ── Cards ───────────────────────────────────────────────────────────────────

const CARD = "rounded-3xl border bg-card shadow-(--shadow-card) p-3 md:p-4 h-full flex flex-col gap-2 min-h-0 overflow-hidden";

function Overview({ stats }: { stats: Stats }) {
  const t = useTranslations("stats.overview");
  const ratePct = Math.round(stats.recoveryRate * 100);
  const isComplete = stats.total > 0 && stats.missed === 0;

  return (
    <div className={CARD}>
      <div className="flex items-start justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">{t("title")}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
        <div className="flex flex-col items-end shrink-0">
          {isComplete ? (
            <Trophy className="w-7 h-7 text-primary" strokeWidth={1.75} />
          ) : (
            <>
              <span className="text-2xl font-bold tabular-nums leading-none text-primary">
                {stats.missed}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{t("remaining")}</span>
            </>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${ratePct}%` }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">
            {isComplete ? t("complete") : t("recoveredOf", { recovered: stats.recovered, total: stats.total })}
          </span>
          <span className="font-semibold tabular-nums text-foreground">{ratePct}%</span>
        </div>
      </div>

      <div className="flex gap-2 flex-1 min-h-0">
        <StatTile value={stats.recovered} label={t("recovered")} />
        <StatTile value={stats.total} label={t("total")} />
        <StatTile value={stats.daysTracked} label={t("daysTracked")} />
      </div>
    </div>
  );
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col flex-1 items-center justify-center gap-1 rounded-2xl bg-primary/10 dark:bg-primary/15 py-1.5 min-h-0">
      <span className="text-lg md:text-xl font-bold tabular-nums leading-none text-primary">{value}</span>
      <span className="text-[10px] text-muted-foreground leading-none text-center px-1">{label}</span>
    </div>
  );
}

function PrayerBreakdown({ stats }: { stats: Stats }) {
  const t = useTranslations("stats.byPrayer");
  const tt = useTranslations("times");
  const maxTotal = Math.max(1, ...PRAYER_ORDER.map((n) => stats.byPrayer[n].total));

  return (
    <div className={CARD}>
      <div className="shrink-0">
        <h2 className="text-sm font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      <div className="flex-1 flex flex-col justify-around gap-1 min-h-0">
        {PRAYER_ORDER.map((name) => {
          const b = stats.byPrayer[name];
          const Icon = PRAYER_ICONS[name];
          const key = DB_TO_KEY[name];
          const widthPct = (b.total / maxTotal) * 100;
          const recoveredPct = b.total ? (b.recovered / b.total) * 100 : 0;
          return (
            <div key={name} className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 w-14 shrink-0">
                <Icon className="w-3 h-3 text-primary shrink-0" />
                <span className="text-[11px] font-medium">{tt(key)}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className="relative h-3.5 rounded-md bg-muted/50 overflow-hidden"
                  style={{ width: `${Math.max(8, widthPct)}%` }}
                >
                  <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${recoveredPct}%` }} />
                  <div className="absolute inset-y-0 bg-primary/25" style={{ left: `${recoveredPct}%`, right: 0 }} />
                </div>
              </div>

              <div className="flex items-baseline gap-0.5 shrink-0 tabular-nums w-14 justify-end text-[11px]">
                <span className="font-semibold text-primary">{b.recovered}</span>
                <span className="text-muted-foreground">/</span>
                <span className="font-semibold">{b.total}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InsightsGrid({ stats }: { stats: Stats }) {
  const t = useTranslations("stats.insights");
  const tp = useTranslations("stats.byPrayer");
  const tt = useTranslations("times");
  const tw = useTranslations("stats.weekdayFull");
  const locale = useLocale();

  const items: Array<{ Icon: React.ElementType; label: string; value: string; sub?: string }> = [
    {
      Icon: Target,
      label: t("mostMissed"),
      value: stats.mostMissedPrayer ? tt(DB_TO_KEY[stats.mostMissedPrayer]) : t("none"),
      sub: stats.mostMissedPrayer ? `${stats.byPrayer[stats.mostMissedPrayer].missed} ${tp("missed")}` : undefined,
    },
    {
      Icon: Calendar,
      label: t("mostMissedDay"),
      value: stats.mostMissedWeekday !== null ? tw(String(stats.mostMissedWeekday)) : t("none"),
      sub: stats.mostMissedWeekday !== null ? `${stats.byWeekday[stats.mostMissedWeekday]} ${tp("missed")}` : undefined,
    },
    {
      Icon: Sparkles,
      label: t("firstRecord"),
      value: formatDate(stats.firstDate, locale),
    },
    {
      Icon: TrendingUp,
      label: t("avgPerWeek"),
      value: stats.avgPerWeek > 0 ? stats.avgPerWeek.toFixed(1) : "0",
    },
  ];

  return (
    <div className={CARD}>
      <div className="shrink-0">
        <h2 className="text-sm font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-1.5 min-h-0">
        {items.map((it, idx) => <InsightTile key={idx} {...it} />)}
      </div>
    </div>
  );
}

function InsightTile({
  Icon, label, value, sub,
}: { Icon: React.ElementType; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-primary/10 dark:bg-primary/15 px-2.5 py-2 flex flex-col justify-center gap-0.5 min-h-0 overflow-hidden">
      <div className="flex items-center gap-1 text-muted-foreground">
        <Icon className="w-3 h-3 shrink-0" />
        <span className="text-[10px] uppercase tracking-wide font-medium leading-tight truncate">{label}</span>
      </div>
      <div className="text-sm md:text-base font-semibold leading-tight tabular-nums truncate text-foreground">
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-muted-foreground tabular-nums leading-tight truncate">{sub}</div>
      )}
    </div>
  );
}

function MonthlyTrend({ stats }: { stats: Stats }) {
  const t = useTranslations("stats.trend");
  const locale = useLocale();
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(1, ...stats.monthly.map((m) => m.missed + m.recovered));
  const hasData = stats.monthly.some((m) => m.missed + m.recovered > 0);

  return (
    <div className={CARD}>
      <div className="shrink-0">
        <h2 className="text-sm font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center min-h-0">
          <p className="text-xs text-muted-foreground">{t("noData")}</p>
        </div>
      ) : (
        <>
          <div className="relative flex items-end gap-1 flex-1 min-h-0 pt-2">
            {stats.monthly.map((m, idx) => {
              const total = m.missed + m.recovered;
              const totalH = (total / max) * 100;
              const recoveredH = total ? (m.recovered / total) * totalH : 0;
              const missedH = totalH - recoveredH;
              const isHover = hover === idx;
              return (
                <div
                  key={`${m.year}-${m.month}`}
                  className="relative flex-1 h-full flex flex-col justify-end items-center cursor-default"
                  onMouseEnter={() => setHover(idx)}
                  onMouseLeave={() => setHover(null)}
                >
                  {isHover && total > 0 && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full z-10 bg-popover border rounded-xl px-2.5 py-1 shadow-md text-[10px] tabular-nums whitespace-nowrap pointer-events-none">
                      <div className="font-medium mb-0.5">{monthShort(m.year, m.month, locale)} {m.year}</div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm bg-primary/30" />
                        <span className="text-muted-foreground">{t("missed")}</span>
                        <span className="ml-2 font-semibold">{m.missed}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm bg-primary" />
                        <span className="text-muted-foreground">{t("recovered")}</span>
                        <span className="ml-2 font-semibold">{m.recovered}</span>
                      </div>
                    </div>
                  )}
                  <div className="w-full flex flex-col justify-end items-stretch h-full">
                    {missedH > 0 && (
                      <div className={cn("rounded-t-sm", isHover ? "bg-primary/40" : "bg-primary/25")} style={{ height: `${missedH}%` }} />
                    )}
                    {recoveredH > 0 && (
                      <div className={cn(missedH === 0 ? "rounded-t-sm" : "", isHover ? "bg-primary/90" : "bg-primary")} style={{ height: `${recoveredH}%` }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-12 gap-1 shrink-0">
            {stats.monthly.map((m, idx) => (
              <div key={`label-${idx}`} className="text-center text-[9px] text-muted-foreground tabular-nums truncate">
                {monthShort(m.year, m.month, locale).slice(0, 3)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function WeekdayChart({ stats }: { stats: Stats }) {
  const t = useTranslations("stats.weekday");
  const max = Math.max(1, ...stats.byWeekday);
  const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

  return (
    <div className={CARD}>
      <div className="shrink-0">
        <h2 className="text-sm font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      <div className="flex items-end gap-1.5 flex-1 min-h-0 pt-1">
        {stats.byWeekday.map((count, idx) => {
          const h = (count / max) * 100;
          const isMax = stats.mostMissedWeekday === idx && count > 0;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full min-h-0">
              <span className={cn("text-[10px] tabular-nums leading-none shrink-0", isMax ? "text-primary font-semibold" : "text-muted-foreground")}>
                {count}
              </span>
              <div className="w-full flex-1 min-h-0 flex items-end">
                <div
                  className={cn(
                    "w-full rounded-t-sm transition-colors",
                    count === 0 ? "bg-muted" : isMax ? "bg-primary" : "bg-primary/30",
                  )}
                  style={{ height: `${Math.max(count > 0 ? 4 : 2, h)}%` }}
                />
              </div>
              <span className={cn("text-[10px] leading-none shrink-0", isMax ? "text-primary font-semibold" : "text-muted-foreground")}>
                {t(dayKeys[idx])}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState() {
  const t = useTranslations("stats");
  return (
    <div className="rounded-3xl border bg-card shadow-(--shadow-card) p-8 flex flex-col items-center justify-center text-center h-full">
      <div className="w-14 h-14 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
        <BarChart2 className="w-7 h-7 text-primary" />
      </div>
      <h2 className="text-base font-semibold mb-1">{t("empty")}</h2>
      <p className="text-xs text-muted-foreground max-w-sm">{t("emptyHint")}</p>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function StatsView({ prayers }: { prayers: MissedPrayer[] }) {
  const stats = useMemo(() => computeStats(prayers), [prayers]);

  if (stats.total === 0) {
    return (
      <main className="flex-1 overflow-hidden p-4 md:p-6 min-h-0">
        <EmptyState />
      </main>
    );
  }

  return (
    <main
      className={cn(
        "flex-1 overflow-hidden p-4 md:p-6 min-h-0",
        "grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4",
        "grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]",
        "md:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)]",
      )}
    >
      <div className="md:col-span-2 min-h-0"><Overview stats={stats} /></div>
      <div className="min-h-0"><PrayerBreakdown stats={stats} /></div>
      <div className="min-h-0"><InsightsGrid stats={stats} /></div>
      <div className="min-h-0"><MonthlyTrend stats={stats} /></div>
      <div className="min-h-0"><WeekdayChart stats={stats} /></div>
    </main>
  );
}
