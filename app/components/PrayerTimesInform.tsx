"use client";

import React from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";

function PrayerTimesInform() {
  const t = useTranslations("inform");
  return (
    <HoverCard openDelay={10} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button className="flex items-center justify-center text-muted-foreground/60 hover:text-primary transition-colors cursor-default">
            <InfoIcon className="w-3.5 h-3.5" />
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="flex w-64 flex-col gap-0.5">
          <div>{t("title")}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {t("description")}
          </div>
        </HoverCardContent>
    </HoverCard>
  );
}

export default PrayerTimesInform;
