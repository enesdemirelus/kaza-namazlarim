"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { PRAYER_NAMES, type PrayerName } from "@/lib/types/database";
import { addMissedPrayersBatch } from "@/app/actions/prayers";
import { X, CheckCircle2, Sunrise, Sun, Sunset, Moon, AlertTriangle } from "lucide-react";

type Status = "idle" | "submitting" | "success";

const PRAYER_ICONS: Record<PrayerName, React.ElementType> = {
  Fajr: Sunrise,
  Dhuhr: Sun,
  Asr: Sun,
  Maghrib: Sunset,
  Isha: Moon,
};

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

function daysBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const a = new Date(start + "T00:00:00");
  const b = new Date(end + "T00:00:00");
  const diff = Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 0;
}

export default function BatchAddModal({ open, onClose, onAdded }: Props) {
  const t = useTranslations("batchModal");
  const router = useRouter();

  const todayStr = new Date().toISOString().slice(0, 10);

  const [selectedPrayers, setSelectedPrayers] = useState<Set<PrayerName>>(new Set());
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [status, setStatus] = useState<Status>("idle");
  const [addedCount, setAddedCount] = useState(0);
  useEffect(() => {
    if (open) {
      setSelectedPrayers(new Set());
      setStartDate(todayStr);
      setEndDate(todayStr);
      setStatus("idle");
      setAddedCount(0);
    }
  }, [open, todayStr]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  function togglePrayer(name: PrayerName) {
    setSelectedPrayers((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const days = daysBetween(startDate, endDate);
  const totalCount = days * selectedPrayers.size;
  const isLargeBatch = totalCount > 100;
  const canSubmit = selectedPrayers.size > 0 && days > 0 && status === "idle";

  async function handleSubmit() {
    if (!canSubmit) return;
    setStatus("submitting");
    try {
      const count = await addMissedPrayersBatch(
        Array.from(selectedPrayers),
        startDate,
        endDate,
      );
      setAddedCount(count);
      setStatus("success");
      router.refresh();
      setTimeout(() => {
        onAdded?.();
        onClose();
      }, 1200);
    } catch {
      setStatus("idle");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-3xl border bg-card shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90dvh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 shrink-0">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-muted hover:bg-muted/70 transition-colors shrink-0 mt-0.5"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-5 overflow-y-auto">

          {/* Prayer multi-selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("selectPrayers")}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRAYER_NAMES.map((name) => {
                const Icon = PRAYER_ICONS[name];
                const isSelected = selectedPrayers.has(name);
                return (
                  <button
                    key={name}
                    onClick={() => togglePrayer(name)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all duration-150",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground shadow-sm"
                        : "bg-muted border-transparent hover:border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="text-[11px] font-medium leading-none">
                      {t(name.toLowerCase() as "fajr" | "dhuhr" | "asr" | "maghrib" | "isha")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("dateRange")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground font-medium px-0.5">
                  {t("startDate")}
                </span>
                <input
                  type="date"
                  value={startDate}
                  max={todayStr}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (e.target.value > endDate) setEndDate(e.target.value);
                  }}
                  className="w-full rounded-xl border bg-muted px-3 py-2.5 text-sm font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground font-medium px-0.5">
                  {t("endDate")}
                </span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={todayStr}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border bg-muted px-3 py-2.5 text-sm font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          {/* Summary / warning */}
          {totalCount > 0 && (
            <div className={cn(
              "rounded-2xl px-4 py-3 flex items-start gap-3",
              isLargeBatch
                ? "bg-amber-500/10 border border-amber-500/30"
                : "bg-primary/8 border border-primary/20",
            )}>
              {isLargeBatch && (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div className="flex flex-col gap-0.5">
                <p className={cn(
                  "text-sm font-semibold",
                  isLargeBatch ? "text-amber-600 dark:text-amber-400" : "text-primary",
                )}>
                  {t("summaryLine", {
                    count: totalCount,
                    days,
                    prayers: selectedPrayers.size,
                  })}
                </p>
                {isLargeBatch && (
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                    {t("largeBatchWarning")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border bg-muted py-3 text-sm font-medium text-muted-foreground hover:bg-muted/70 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                "flex-2 rounded-xl py-3 text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 px-4",
                !canSubmit
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:opacity-90 shadow-sm",
              )}
            >
              {status === "success" ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {t("success", { count: addedCount })}
                </>
              ) : status === "submitting" ? (
                <span className="opacity-70">{t("submitting")}</span>
              ) : (
                t("submit", { count: totalCount || 0 })
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
