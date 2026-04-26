import PrayerTimesWidget from "@/app/components/PrayerTimes";
import AddNewBox from "@/app/components/AddNewBox";
import MissedPrayersBox from "@/app/components/MissedPrayersBox";
import SeedButton from "@/app/components/SeedButton";
import { getMissedPrayers } from "@/app/actions/prayers";

export default async function Home() {
  const prayers = await getMissedPrayers().catch(() => []);

  return (
    <main className="flex-1 overflow-hidden flex flex-col gap-3 p-4 md:grid md:grid-cols-[1fr_1fr] md:gap-4 md:p-6">
      <PrayerTimesWidget />
      <div className="flex-1 min-h-0 flex flex-col gap-3 md:grid md:grid-rows-2 md:gap-4 md:min-h-0">
        <AddNewBox />
        <MissedPrayersBox prayers={prayers} />
      </div>
      {process.env.NODE_ENV === "development" && <SeedButton />}
    </main>
  );
}
