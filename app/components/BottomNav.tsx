"use client";

import Link from "next/link";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Home, BarChart2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { key: "home", href: "/", Icon: Home },
  { key: "graph", href: "/graph", Icon: BarChart2 },
  { key: "settings", href: "/settings", Icon: Settings },
] as const;

export default function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <div className="flex items-center justify-around rounded-xl border bg-card shadow-(--shadow-card) px-2 py-2">
        {items.map(({ key, href, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={key}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors text-xs font-medium",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
              <span>{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
