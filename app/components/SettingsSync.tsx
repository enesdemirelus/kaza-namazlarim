"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { getUserSettings, saveUserSettings } from "@/app/actions/settings";

// Runs once per session after sign-in.
// New user  → pushes localStorage prefs to DB.
// Returning user on new device → pulls DB prefs and applies them locally.
export default function SettingsSync() {
  const { setTheme } = useTheme();
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;
    synced.current = true;
    sessionStorage.setItem("knm-settings-synced", "1");

    async function sync() {
      const db = await getUserSettings();

      if (db) {
        // Returning user: apply DB prefs locally.
        // Only set theme if the user hasn't already chosen one this session
        // (e.g. via the SetupModal) — avoids overriding an in-flight click.
        if (!localStorage.getItem("theme")) {
          setTheme(db.theme);
        }
        localStorage.setItem("accent-color", db.accentColor);
        localStorage.setItem("knm-prayer-method", db.prayerMethod);
        document.documentElement.setAttribute("data-color", db.accentColor);
      } else {
        // New user: push localStorage defaults → DB
        const theme = localStorage.getItem("theme") ?? "light";
        const accentColor = localStorage.getItem("accent-color") ?? "green";
        const prayerMethod =
          localStorage.getItem("knm-prayer-method") ?? "Turkey";
        const locale = document.documentElement.lang.split("-")[0] ?? "tr";

        await saveUserSettings({ locale, theme, accentColor, prayerMethod });
      }
    }

    sync().catch(console.error);
  }, [setTheme]);

  return null;
}
