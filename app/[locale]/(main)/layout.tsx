import { auth } from "@clerk/nextjs/server";
import NavBar from "@/app/components/NavBar";
import BottomNav from "@/app/components/BottomNav";
import { upsertUser } from "@/app/actions/prayers";
import SettingsSync from "@/app/components/SettingsSync";
import SetupModal from "@/app/components/SetupModal";
import { getUserSettings } from "@/app/actions/settings";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  let onboardingDone = false;
  if (userId) {
    try {
      await upsertUser();
    } catch {
      // Non-fatal: continue rendering even if sync fails
    }
    const settings = await getUserSettings();
    onboardingDone = settings?.onboardingDone ?? false;
  }

  return (
    <div className="h-full flex flex-col pb-20 md:pb-0 overflow-hidden">
      <SettingsSync />
      <SetupModal defaultOpen={!onboardingDone} />
      <NavBar />
      {children}
      <BottomNav />
    </div>
  );
}
