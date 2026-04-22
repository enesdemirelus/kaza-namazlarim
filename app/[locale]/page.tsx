import PrayerTimesWidget from "@/app/components/PrayerTimes";
import AddNewBox from "@/app/components/AddNewBox";
import OverviewBox from "@/app/components/OverviewBox";

export default function Home() {
  return (
    <main className="flex-1 grid grid-cols-[1fr_1fr] gap-4 p-6">
      {/* Left — Prayer Times (tall, spans full height) */}
      <PrayerTimesWidget />

      {/* Right — two stacked boxes */}
      <div className="grid grid-rows-2 gap-4">
        <AddNewBox />
        <OverviewBox />
      </div>
    </main>
  );
}
