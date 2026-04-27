"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { PRAYER_NAMES, type PrayerName, type MissedPrayer } from "@/lib/types/database";
import { getMissedPrayersByName, deleteMissedPrayer } from "@/app/actions/prayers";
import {
  X, Sunrise, Sun, Sunset, Moon,
  Trash2, CalendarDays, CheckCircle2, Loader2,
} from "lucide-react";

type Step = "select" | "list";
type Status = "idle" | "removing" | "success";

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
  onRemoved?: () => void;
}

export default function RemoveQadaModal({ open, onClose, onRemoved }: Props) {
  const t = useTranslations("removeModal");
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<PrayerName | null>(null);
  const [entries, setEntries] = useState<MissedPrayer[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("select");
      setSelected(null);
      setEntries([]);
      setStatus("idle");
      setRemovingId(null);
      setSelectedEntryId(null);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  async function selectPrayer(name: PrayerName) {
    setSelected(name);
    setLoadingEntries(true);
    setStep("list");
    try {
      const data = await getMissedPrayersByName(name);
      setEntries(data);
    } finally {
      setLoadingEntries(false);
    }
  }

  async function removeEntry(id: string) {
    if (removingId) return;
    setRemovingId(id);
    setStatus("removing");
    try {
      await deleteMissedPrayer(id);
      setStatus("success");
      router.refresh();
      setTimeout(() => {
        onRemoved?.();
        onClose();
      }, 900);
    } catch {
      setRemovingId(null);
      setStatus("idle");
    }
  }

  async function removeSelected() {
    if (!selectedEntryId) return;
    await removeEntry(selectedEntryId);
  }

  function selectLatest() {
    if (!entries.length) return;
    setSelectedEntryId(entries[0].id);
  }

  function formatDate(dateStr: string): string {
    if (!dateStr || dateStr === "1970-01-01") return t("undated");
    return new Date(dateStr + "T00:00:00").toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border bg-card shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200 max-h-[90dvh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              {step === "list" && (
                <button
                  onClick={() => setStep("select")}
                  className="w-6 h-6 rounded-lg flex items-center justify-center bg-muted hover:bg-muted/70 transition-colors"
                >
                  <svg className="w-3 h-3 text-muted-foreground" viewBox="0 0 10 10" fill="none">
                    <path d="M7 2L3 5l4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
              <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {step === "select" ? t("subtitle") : selected && t(selected.toLowerCase() as "fajr" | "dhuhr" | "asr" | "maghrib" | "isha")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-muted hover:bg-muted/70 transition-colors shrink-0 mt-0.5"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-4 overflow-y-auto">

          {/* ── Step 1: Prayer selector ── */}
          {step === "select" && (
            <>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("selectPrayer")}
              </label>
              <div className="grid grid-cols-5 gap-2">
                {PRAYER_NAMES.map((name) => {
                  const Icon = PRAYER_ICONS[name];
                  return (
                    <button
                      key={name}
                      onClick={() => selectPrayer(name)}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border border-transparent bg-muted hover:border-border hover:text-foreground text-muted-foreground transition-all duration-150"
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="text-[11px] font-medium leading-none">
                        {t(name.toLowerCase() as "fajr" | "dhuhr" | "asr" | "maghrib" | "isha")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Step 2: Entry list ── */}
          {step === "list" && (
            <>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("entriesTitle")}
                  </label>
                  {!loadingEntries && entries.length > 0 && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {entries.length}
                    </span>
                  )}
                </div>

                {/* Loading */}
                {loadingEntries && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                  </div>
                )}

                {/* Empty */}
                {!loadingEntries && entries.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 rounded-2xl bg-muted">
                    <CalendarDays className="w-8 h-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">{t("noEntries")}</p>
                  </div>
                )}

                {/* List */}
                {!loadingEntries && entries.length > 0 && (
                  <ul className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
                    {entries.map((entry, i) => {
                      const isLatest = i === 0;
                      const isSelected = selectedEntryId === entry.id;
                      return (
                        <li key={entry.id}>
                          <button
                            onClick={() => setSelectedEntryId(isSelected ? null : entry.id)}
                            disabled={status !== "idle"}
                            className={cn(
                              "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition-all duration-150 text-left",
                              isSelected
                                ? "bg-destructive/15 border border-destructive/40 ring-1 ring-destructive/20"
                                : isLatest
                                  ? "bg-muted/80 border border-border hover:bg-muted"
                                  : "bg-muted hover:bg-muted/60 border border-transparent",
                              status !== "idle" && "opacity-40 pointer-events-none",
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <CalendarDays className={cn(
                                "w-4 h-4 shrink-0",
                                isSelected ? "text-destructive" : "text-muted-foreground",
                              )} />
                              <div className="min-w-0">
                                <span className={cn(
                                  "text-sm font-medium block",
                                  isSelected ? "text-destructive" : "text-foreground",
                                )}>
                                  {formatDate(entry.date)}
                                </span>
                                {isLatest && (
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    latest
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Selection indicator */}
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                              isSelected
                                ? "border-destructive bg-destructive"
                                : "border-border bg-transparent",
                            )}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" viewBox="0 0 10 10" fill="none">
                                  <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {!loadingEntries && entries.length > 0 && (
                <>
                  <div className="h-px bg-border" />

                  {/* Quick-select latest hint */}
                  {!selectedEntryId && (
                    <button
                      onClick={selectLatest}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      {t("removeLatestHint")}
                    </button>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={onClose}
                      className="flex-1 rounded-xl border bg-muted py-3 text-sm font-medium text-muted-foreground hover:bg-muted/70 transition-colors"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      onClick={removeSelected}
                      disabled={!selectedEntryId || status !== "idle"}
                      className={cn(
                        "flex-2 rounded-xl py-3 text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2",
                        !selectedEntryId || status !== "idle"
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : "bg-destructive text-white hover:bg-destructive/90",
                      )}
                    >
                      {status === "success" ? (
                        <><CheckCircle2 className="w-4 h-4" />{t("success")}</>
                      ) : status === "removing" ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />{t("removing")}</>
                      ) : (
                        <><Trash2 className="w-4 h-4" />{t("removeSelected")}</>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* Empty state footer */}
              {!loadingEntries && entries.length === 0 && (
                <button
                  onClick={onClose}
                  className="w-full rounded-xl border bg-muted py-3 text-sm font-medium text-muted-foreground hover:bg-muted/70 transition-colors"
                >
                  {t("cancel")}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
