"use client";

import { useTranslations } from "next-intl";

import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { UserButton } from "@clerk/nextjs";
import LocaleSwitcher from "./LocaleSwitcher";
import { Settings } from "lucide-react";
import { Link as NavLink } from "@/i18n/navigation";

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

  return (
    <header className="px-4 pt-4 md:px-6">
      <div className="w-full px-4 md:px-8 h-14 md:h-16 flex items-center justify-between rounded-xl border bg-card shadow-(--shadow-card)">
        {/* Logo */}
        <Link href="/" className="text-base md:text-lg font-semibold tracking-tight">
          {t("title")}
        </Link>

        {/* Nav — hidden on mobile */}
        <NavigationMenu className="hidden md:flex">
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
                <Link href="/stats">{t("stats")}</Link>
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
          <LocaleSwitcher />
          {/* Settings icon — mobile only */}
          <NavLink
            href="/settings"
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-5 h-5" />
          </NavLink>
          {/* User avatar — desktop only */}
          <div className="hidden md:block">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
