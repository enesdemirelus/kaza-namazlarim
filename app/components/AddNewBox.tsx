"use client";

import { useTranslations } from "next-intl";
import { PlusCircle, PlusSquare, MinusCircle, MinusSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const BUTTONS = [
  { key: "addOne",     Icon: PlusCircle,  variant: "primary" },
  { key: "addBatch",   Icon: PlusSquare,  variant: "primary" },
  { key: "removeOne",  Icon: MinusCircle, variant: "ghost"   },
  { key: "removeBatch",Icon: MinusSquare, variant: "ghost"   },
] as const;

export default function AddNewBox() {
  const t = useTranslations("actions");

  return (
    <div className="rounded-3xl border bg-card shadow-(--shadow-card) p-4 md:p-5 flex-1 min-h-0 flex flex-col gap-3">

      <div className="shrink-0">
        <h2 className="text-sm font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 grid-rows-2 gap-2 flex-1 min-h-0">
        {BUTTONS.map(({ key, Icon, variant }) => (
          <button
            key={key}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-2xl cursor-pointer transition-all w-full h-full",
              variant === "primary"
                ? "bg-primary/10 dark:bg-primary/15 hover:bg-primary/20 dark:hover:bg-primary/25"
                : "bg-muted hover:bg-muted/70",
            )}
          >
            <Icon
              className={cn(
                "w-6 h-6 shrink-0",
                variant === "primary" ? "text-primary" : "text-muted-foreground",
              )}
            />
            <span
              className={cn(
                "text-xs font-medium leading-tight text-center px-2",
                variant === "primary" ? "text-primary" : "text-muted-foreground",
              )}
            >
              {t(key)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
