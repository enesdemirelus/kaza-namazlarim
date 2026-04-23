import PrayerTimesWidget from "@/app/components/PrayerTimes";
import AddNewBox from "@/app/components/AddNewBox";
import OverviewBox from "@/app/components/OverviewBox";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col gap-4 p-4 md:grid md:grid-cols-[1fr_1fr] md:gap-4 md:p-6">
      {/* Prayer Times — full card on desktop, compact strip on mobile */}
      <PrayerTimesWidget />

      {/* Two boxes — stacked on both mobile and desktop */}
      <div className="grid grid-cols-1 gap-4 md:grid-rows-2">
        <AddNewBox />
        <OverviewBox />
      </div>
    </main>
  );
}
