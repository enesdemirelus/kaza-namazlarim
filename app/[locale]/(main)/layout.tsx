import NavBar from "@/app/components/NavBar";
import BottomNav from "@/app/components/BottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col pb-20 md:pb-0 overflow-hidden">
      <NavBar />
      {children}
      <BottomNav />
    </div>
  );
}
