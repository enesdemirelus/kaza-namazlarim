"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Clock,
  BookOpen,
  PlusCircle,
  PlusSquare,
  CheckCircle,
  CheckSquare,
  LayoutDashboard,
} from "lucide-react";
import { saveUserSettings } from "@/app/actions/settings";

type Side = "top" | "bottom" | "left" | "right";

interface StepDef {
  selector: string;
  side: Side;
  icon: React.ReactNode;
  title: string;
  content: string;
  pad?: number;
  radius?: number;
}

interface Rect { top: number; left: number; width: number; height: number; }

const CARD_W = 288;
const GAP = 16;
const CARD_H_EST = 240;

function getRect(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function calcCardStyle(rect: Rect, side: Side): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;

  // Horizontal: centered on element, clamped so card stays on-screen
  const hLeft = Math.max(8, Math.min(vw - CARD_W - 8, cx - CARD_W / 2));

  // Vertical anchors for above/below placement
  const topIfBelow = rect.top + rect.height + GAP;
  const topIfAbove = rect.top - GAP - CARD_H_EST;
  const fitsBelow  = topIfBelow + CARD_H_EST <= vh - 8;
  const fitsAbove  = topIfAbove >= 8;

  // Side anchors (fallback when element is too tall to fit above/below)
  const leftIfRight = rect.left + rect.width + GAP;
  const leftIfLeft  = rect.left - GAP - CARD_W;
  const sideTop     = Math.max(8, Math.min(vh - CARD_H_EST - 8, cy - CARD_H_EST / 2));
  const fitsRight   = leftIfRight + CARD_W <= vw - 8;
  const fitsLeft    = leftIfLeft >= 8;

  if (side === "bottom") {
    if (fitsBelow) return { top: topIfBelow, left: hLeft };
    if (fitsAbove) return { top: topIfAbove, left: hLeft };
    if (fitsRight) return { top: sideTop, left: leftIfRight };
    if (fitsLeft)  return { top: sideTop, left: leftIfLeft  };
  }

  if (side === "top") {
    if (fitsAbove) return { top: topIfAbove, left: hLeft };
    if (fitsBelow) return { top: topIfBelow, left: hLeft };
    if (fitsRight) return { top: sideTop, left: leftIfRight };
    if (fitsLeft)  return { top: sideTop, left: leftIfLeft  };
  }

  // Last resort: center vertically, centered on element horizontally
  return { top: Math.max(8, (vh - CARD_H_EST) / 2), left: hLeft };
}

export default function Tour({ initialSeen, onboardingDone }: { initialSeen: boolean; onboardingDone: boolean }) {
  const t = useTranslations("tour");
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const idxRef = useRef(idx);
  idxRef.current = idx;
  const replayTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
  }, []);

  // Defined after isMobile is set
  const getSteps = useCallback((): StepDef[] => [
    { selector: "#tour-prayer-times",   side: "bottom", icon: <Clock className="w-5 h-5" />,        title: t("prayerTimes.title"),   content: isMobile ? t("prayerTimes.descriptionMobile") : t("prayerTimes.description"), pad: 8,  radius: 28 },
    { selector: "#tour-missed-prayers", side: "bottom", icon: <BookOpen className="w-5 h-5" />,      title: t("missedPrayers.title"), content: t("missedPrayers.description"),  pad: 8,  radius: 28 },
    { selector: "#tour-action-addOne",  side: "top",    icon: <PlusCircle className="w-5 h-5" />,    title: t("addOne.title"),        content: t("addOne.description"),         pad: 6,  radius: 14 },
    { selector: "#tour-action-addBatch",side: "top",    icon: <PlusSquare className="w-5 h-5" />,    title: t("addBatch.title"),      content: t("addBatch.description"),       pad: 6,  radius: 14 },
    { selector: "#tour-action-removeOne",side: "top",   icon: <CheckCircle className="w-5 h-5" />,   title: t("removeOne.title"),     content: t("removeOne.description"),      pad: 6,  radius: 14 },
    { selector: "#tour-action-removeBatch",side: "top", icon: <CheckSquare className="w-5 h-5" />,   title: t("removeBatch.title"),   content: t("removeBatch.description"),    pad: 6,  radius: 14 },
    { selector: "#tour-navbar",         side: "bottom", icon: <LayoutDashboard className="w-5 h-5" />,title: t("navbar.title"),       content: t("navbar.description"),         pad: 8,  radius: 16 },
  ], [t, isMobile]);

  const updateRect = useCallback((stepIdx: number) => {
    const steps = getSteps();
    const step = steps[stepIdx];
    if (!step) return;
    const r = getRect(step.selector);
    setRect(r);
  }, [getSteps]);

  // Replay listener — permanent, so it works even when the component stays
  // mounted across client-side navigation from Settings
  useEffect(() => {
    const onReplay = () => {
      clearTimeout(replayTimer.current);
      setIdx(0);
      setRect(null);
      replayTimer.current = setTimeout(() => setVisible(true), 600);
    };
    window.addEventListener("knm-replay-tour", onReplay);
    return () => {
      window.removeEventListener("knm-replay-tour", onReplay);
      clearTimeout(replayTimer.current);
    };
  }, []);

  // Start tour — only if not yet seen, and only after onboarding is complete
  useEffect(() => {
    if (!mounted || initialSeen) return;

    const start = () => {
      const timer = setTimeout(() => setVisible(true), 600);
      return timer;
    };

    if (onboardingDone) {
      const timer = start();
      return () => clearTimeout(timer);
    }

    // Onboarding not done yet — wait for it to finish, then start tour
    let timer: ReturnType<typeof setTimeout>;
    const onDone = () => { timer = start(); };
    window.addEventListener("knm-onboarding-done", onDone);
    return () => {
      window.removeEventListener("knm-onboarding-done", onDone);
      clearTimeout(timer);
    };
  }, [mounted, initialSeen, onboardingDone]);

  // Measure element when step changes or tour becomes visible
  useEffect(() => {
    if (!visible) { setRect(null); return; }
    // Small delay so the DOM has settled, then measure
    const timer = setTimeout(() => updateRect(idxRef.current), 100);
    window.addEventListener("resize", () => updateRect(idxRef.current));
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", () => updateRect(idxRef.current));
    };
  }, [visible, idx, updateRect]);

  const steps = getSteps();
  const step = steps[idx];
  const total = steps.length;

  const finish = useCallback(() => {
    setVisible(false);
    saveUserSettings({ tourSeen: true }).catch(console.error);
  }, []);

  const goNext = useCallback(() => {
    const next = idxRef.current + 1;
    if (next < steps.length) { setRect(null); setIdx(next); }
    else finish();
  }, [steps.length, finish]);

  const goPrev = useCallback(() => {
    const prev = idxRef.current - 1;
    if (prev >= 0) { setRect(null); setIdx(prev); }
  }, []);

  if (!mounted || !visible || !rect || !step) return null;

  const pad    = step.pad    ?? 8;
  const radius = step.radius ?? 16;
  const cs     = calcCardStyle(rect, step.side);

  return createPortal(
    <>
      {/* Dark overlay — clicking the dark area advances to next step */}
      <div
        className="fixed inset-0 z-[900]"
        onClick={idx === total - 1 ? finish : goNext}
      />

      {/* Spotlight — pointer-events auto so tapping the spotlit element
          is absorbed here (not by the overlay), preventing accidental advance */}
      <div
        className="fixed z-[901]"
        style={{
          top:          rect.top  - pad,
          left:         rect.left - pad,
          width:        rect.width  + pad * 2,
          height:       rect.height + pad * 2,
          borderRadius: radius,
          boxShadow:    "0 0 200vw 200vh rgba(0,0,0,0.55)",
        }}
      />

      {/* Tour card */}
      <div
        className="fixed z-[999] w-72"
        style={cs}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-2xl border bg-card text-card-foreground shadow-xl">
          <div className="p-5 flex flex-col gap-4">

            <div className="flex items-center gap-3">
              {step.icon && (
                <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {step.icon}
                </div>
              )}
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                  {idx + 1} / {total}
                </p>
                <h3 className="text-sm font-semibold leading-tight">{step.title}</h3>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">{step.content}</p>

            {idx === total - 1 && (
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed border-t pt-3 -mt-1">
                {t("replayHint")}
              </p>
            )}

            <div className="flex gap-1">
              {Array.from({ length: total }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-300",
                    i < idx ? "bg-primary/40" : i === idx ? "bg-primary" : "bg-border"
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goPrev}
                disabled={idx === 0}
                className="h-8 px-3 text-xs gap-1.5"
              >
                <ArrowLeft className="w-3 h-3" />
                {t("prev")}
              </Button>
              <Button
                size="sm"
                onClick={goNext}
                className="h-8 px-3 text-xs gap-1.5 ml-auto"
              >
                {idx === total - 1 ? t("done") : t("next")}
                {idx < total - 1 && <ArrowRight className="w-3 h-3" />}
              </Button>
            </div>

          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
