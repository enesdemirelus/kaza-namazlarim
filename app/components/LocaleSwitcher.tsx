"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import TR from "country-flag-icons/react/3x2/TR";
import GB from "country-flag-icons/react/3x2/GB";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "tr", label: "TR", Flag: TR },
  { code: "en", label: "EN", Flag: GB },
] as const;

export default function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1 bg-muted rounded-xl p-0.5">
      {LOCALES.map(({ code, label, Flag }) => (
        <button
          key={code}
          onClick={() => router.replace(pathname, { locale: code })}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-xs font-medium transition-all",
            locale === code
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Flag className="h-3 w-auto rounded-[2px] shrink-0" />
          {label}
        </button>
      ))}
    </div>
  );
}
