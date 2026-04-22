"use client";

import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

import Link from "next/link";
import TR from "country-flag-icons/react/3x2/TR";
import GB from "country-flag-icons/react/3x2/GB";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ModeToggle } from "./ModeToggle";

const locales = [
  { code: "tr", label: "TR", Flag: TR },
  { code: "en", label: "EN", Flag: GB },
] as const;

// ---------------------------------------------------------------------------
// DROPDOWN EXAMPLE — copy this block to add a dropdown nav item.
//
// 1. Define your items array:
//
//   const exampleItems = [
//     { title: "Option A", href: "/a", description: "Short description." },
//     { title: "Option B", href: "/b", description: "Short description." },
//   ];
//
// 2. Add the item inside <NavigationMenuList>:
//
//   <NavigationMenuItem>
//     <NavigationMenuTrigger>Label</NavigationMenuTrigger>
//     <NavigationMenuContent>
//       <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
//         {exampleItems.map((item) => (
//           <li key={item.title}>
//             <NavigationMenuLink asChild>
//               <Link
//                 href={item.href}
//                 className={cn(
//                   "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors",
//                   "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
//                 )}
//               >
//                 <div className="text-sm font-medium leading-none">{item.title}</div>
//                 <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
//                   {item.description}
//                 </p>
//               </Link>
//             </NavigationMenuLink>
//           </li>
//         ))}
//       </ul>
//     </NavigationMenuContent>
//   </NavigationMenuItem>
// ---------------------------------------------------------------------------

export default function NavBar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(code: string) {
    router.replace(pathname, { locale: code });
  }

  return (
    <header className="px-6 pt-4">
      <div className="w-full px-8 h-16 flex items-center justify-between rounded-xl border bg-card shadow-[var(--shadow-card)]">
        {/* Logo */}
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {t("title")}
        </Link>

        {/* Nav */}
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle()}
              >
                <Link href="/">{t("home")}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle()}
              >
                <Link href="/graph">{t("graph")}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle()}
              >
                <Link href="/settings">{t("settings")}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          {(() => {
            const next = locales.find((l) => l.code !== locale) ?? locales[0];
            return (
              <button
                onClick={() => switchLocale(next.code)}
                className="text-sm font-medium px-4 py-2 rounded-md border hover:bg-accent transition-colors flex items-center justify-center"
              >
                <next.Flag className="h-4 w-auto rounded-[2px]" />
                <span className="sr-only">Switch to {next.label}</span>
              </button>
            );
          })()}

          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
