import { auth } from "@clerk/nextjs/server";
import NavBar from "@/app/components/NavBar";
import { upsertUser } from "@/app/actions/prayers";
import SettingsSync from "@/app/components/SettingsSync";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (userId) {
    try {
      await upsertUser();
    } catch {
      // Non-fatal: continue rendering even if sync fails
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <SettingsSync />
      <NavBar />
      {children}
    </div>
  );
}
