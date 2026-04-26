import React from "react";
import PrayerTimesWidget from "@/app/components/PrayerTimes";
import PrayerTimesInform from "@/app/components/PrayerTimesInform";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

function page() {
  return (
    <div>
      <PrayerTimesInform></PrayerTimesInform>
    </div>
  );
}

export default page;
