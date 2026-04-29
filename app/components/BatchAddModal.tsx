"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { tr as trLocale, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PRAYER_NAMES, type PrayerName } from "@/lib/types/database";
import { addMissedPrayersBatch, addMissedPrayersByCount } from "@/app/actions/prayers";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, CheckCircle2, Sunrise, Sun, Sunset, Moon, AlertTriangle, CalendarIcon } from "lucide-react";

type Status = "idle" | "submitting" | "success";
type Mode = "range" | "count";

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

export default function BatchAddModal({ open, onClose, onAdded }: Props) {
  const t = useTranslations("batchModal");
  const locale = useLocale();
  const dateLocale = locale === "tr" ? trLocale : enUS;
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("range");
  const [selectedPrayers, setSelectedPrayers] = useState<Set<PrayerName>>(new Set());
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [countInput, setCountInput] = useState<string>("1");
  const [status, setStatus] = useState<Status>("idle");
  const [addedCount, setAddedCount] = useState(0);

  useEffect(() => {
    if (open) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      setMode("range");
      setSelectedPrayers(new Set());
      setStartDate(d);
      setEndDate(d);
      setCountInput("1");
      setStatus("idle");
      setAddedCount(0);
    }
  }, [open]);

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

  const days =
    startDate && endDate
      ? Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : startDate ? 1 : 0;
  const parsedCount = Math.max(0, Math.floor(Number(countInput) || 0));
  const totalCount =
    mode === "range"
      ? Math.max(0, days) * selectedPrayers.size
      : parsedCount * selectedPrayers.size;
  const isLargeBatch = totalCount > 100;
  const canSubmit =
    selectedPrayers.size > 0 &&
    status === "idle" &&
    (mode === "range" ? days > 0 : parsedCount > 0);

  async function handleSubmit() {
    if (!canSubmit) return;
    setStatus("submitting");
    try {
      let count = 0;
      if (mode === "range") {
        if (!startDate || !endDate) {
          setStatus("idle");
          return;
        }
        count = await addMissedPrayersBatch(
          Array.from(selectedPrayers),
          format(startDate, "yyyy-MM-dd"),
          format(endDate, "yyyy-MM-dd"),
        );
      } else {
        count = await addMissedPrayersByCount(
          Array.from(selectedPrayers),
          parsedCount,
        );
      }
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

          {/* Mode toggle */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("mode")}
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-muted">
              <button
                type="button"
                onClick={() => setMode("range")}
                className={cn(
                  "py-2 rounded-xl text-xs font-semibold transition-all duration-150",
                  mode === "range"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t("modeRange")}
              </button>
              <button
                type="button"
                onClick={() => setMode("count")}
                className={cn(
                  "py-2 rounded-xl text-xs font-semibold transition-all duration-150",
                  mode === "count"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t("modeCount")}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground px-0.5">
              {mode === "range" ? t("modeRangeHint") : t("modeCountHint")}
            </p>
          </div>

          {/* Date range pickers */}
          {mode === "range" && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("dateRange")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Start date */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground font-medium px-0.5">{t("startDate")}</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full flex items-center gap-2 rounded-xl border bg-muted px-3 py-2.5 text-sm font-medium text-left hover:bg-muted/70 transition-colors">
                      <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className={cn("truncate", startDate ? "text-foreground" : "text-muted-foreground")}>
                        {startDate ? format(startDate, "MMM d, yyyy", { locale: dateLocale }) : "—"}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => {
                        setStartDate(d);
                        if (d && endDate && d > endDate) setEndDate(d);
                      }}
                      disabled={(date) => date > new Date()}
                      captionLayout="dropdown"
                      locale={dateLocale}
                      defaultMonth={startDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {/* End date */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground font-medium px-0.5">{t("endDate")}</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full flex items-center gap-2 rounded-xl border bg-muted px-3 py-2.5 text-sm font-medium text-left hover:bg-muted/70 transition-colors">
                      <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className={cn("truncate", endDate ? "text-foreground" : "text-muted-foreground")}>
                        {endDate ? format(endDate, "MMM d, yyyy", { locale: dateLocale }) : "—"}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
                      captionLayout="dropdown"
                      locale={dateLocale}
                      defaultMonth={endDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          )}

          {/* Count input */}
          {mode === "count" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("count")}
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={countInput}
                onChange={(e) => setCountInput(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="0"
                className="w-full rounded-xl border bg-muted px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/70 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
              />
              <p className="text-[11px] text-muted-foreground px-0.5">
                {t("countHint")}
              </p>
            </div>
          )}

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
                  {mode === "range"
                    ? t("summaryLine", {
                        count: totalCount,
                        days,
                        prayers: selectedPrayers.size,
                      })
                    : t("summaryLineCount", {
                        count: totalCount,
                        n: parsedCount,
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
