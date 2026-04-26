import { auth } from "@clerk/nextjs/server";
import NavBar from "@/app/components/NavBar";
import BottomNav from "@/app/components/BottomNav";
import { upsertUser } from "@/app/actions/prayers";

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
    <div className="h-full flex flex-col pb-20 md:pb-0 overflow-hidden">
      <NavBar />
      {children}
      <BottomNav />
    </div>
  );
}
