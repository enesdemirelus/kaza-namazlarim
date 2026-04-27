import { getMissedPrayers } from "@/app/actions/prayers";
import StatsView from "@/app/components/StatsView";

export default async function StatsPage() {
  const prayers = await getMissedPrayers().catch(() => []);
  return <StatsView prayers={prayers} />;
}
