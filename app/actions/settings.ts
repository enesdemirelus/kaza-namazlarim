"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export interface UserSettings {
  locale: string;
  theme: string;
  accentColor: string;
  prayerMethod: string;
}

export async function getUserSettings(): Promise<UserSettings | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select("locale, theme, accent_color, prayer_method")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return {
    locale: data.locale,
    theme: data.theme,
    accentColor: data.accent_color,
    prayerMethod: data.prayer_method,
  };
}

export async function saveUserSettings(settings: Partial<UserSettings>): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      ...(settings.locale !== undefined && { locale: settings.locale }),
      ...(settings.theme !== undefined && { theme: settings.theme }),
      ...(settings.accentColor !== undefined && { accent_color: settings.accentColor }),
      ...(settings.prayerMethod !== undefined && { prayer_method: settings.prayerMethod }),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw new Error(error.message);
}

export async function completeOnboarding(settings: Partial<UserSettings>): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await saveUserSettings(settings);

  const client = await clerkClient();
  await client.users.updateUser(userId, {
    publicMetadata: { onboardingComplete: true },
  });

  redirect("/");
}
