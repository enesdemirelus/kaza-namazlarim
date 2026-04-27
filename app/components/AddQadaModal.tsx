"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { tr as trLocale, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PRAYER_NAMES, type PrayerName } from "@/lib/types/database";
import { addMissedPrayer } from "@/app/actions/prayers";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, CheckCircle2, Sunrise, Sun, Sunset, Moon, CalendarX2, CalendarIcon } from "lucide-react";

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

export default function AddQadaModal({ open, onClose, onAdded }: Props) {
  const t = useTranslations("addModal");
  const locale = useLocale();
  const dateLocale = locale === "tr" ? trLocale : enUS;
  const router = useRouter();

  const [selected, setSelected] = useState<PrayerName | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [ignoreDate, setIgnoreDate] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (open) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      setSelected(null);
      setSelectedDate(d);
      setIgnoreDate(false);
      setStatus("idle");
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

  async function handleSubmit() {
    if (!selected || status !== "idle") return;
    setStatus("submitting");
    try {
      const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;
      await addMissedPrayer(selected, ignoreDate ? undefined : dateStr);
      setStatus("success");
      router.refresh();
      setTimeout(() => {
        onAdded?.();
        onClose();
      }, 900);
    } catch {
      setStatus("idle");
    }
  }

  const dateLabel = selectedDate
    ? format(selectedDate, "MMM d, yyyy", { locale: dateLocale })
    : t("selectDate");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border bg-card shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200 max-h-[90dvh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
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

          {/* Prayer selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("selectPrayer")}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRAYER_NAMES.map((name) => {
                const Icon = PRAYER_ICONS[name];
                const isSelected = selected === name;
                return (
                  <button
                    key={name}
                    onClick={() => setSelected(name)}
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

          {/* Date picker */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("selectDate")}
            </label>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  disabled={ignoreDate}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-xl border bg-muted px-4 py-3 text-sm font-medium text-left transition-colors",
                    ignoreDate
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-muted/70",
                  )}
                >
                  <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className={cn(selectedDate && !ignoreDate ? "text-foreground" : "text-muted-foreground")}>
                    {dateLabel}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date > new Date()}
                  captionLayout="dropdown"
                  locale={dateLocale}
                  defaultMonth={selectedDate}
                />
              </PopoverContent>
            </Popover>

            {/* Ignore date toggle */}
            <button
              onClick={() => setIgnoreDate((v) => !v)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors w-full text-left",
                ignoreDate
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors",
                ignoreDate ? "bg-primary border-primary" : "border-border bg-background",
              )}>
                {ignoreDate && (
                  <svg className="w-2.5 h-2.5 text-primary-foreground" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <CalendarX2 className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs font-medium">{t("ignoreDateLabel")}</span>
            </button>

            {ignoreDate && (
              <p className="text-[11px] text-muted-foreground px-1">{t("ignoreDateHint")}</p>
            )}
          </div>

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
              disabled={!selected || status !== "idle"}
              className={cn(
                "flex-2 rounded-xl py-3 text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2",
                !selected || status !== "idle"
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:opacity-90 shadow-sm",
              )}
            >
              {status === "success" && (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {t("success")}
                </>
              )}
              {status === "submitting" && (
                <span className="opacity-70">{t("submitting")}</span>
              )}
              {status === "idle" && t("submit")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
