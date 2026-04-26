"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import type { PrayerName } from "@/lib/types/database";
import { upsertUser } from "./prayers";

const PRAYER_NAMES: PrayerName[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export async function seedMissedPrayers(): Promise<number> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await upsertUser();

  const rows = Array.from({ length: 55 }, () => ({
    user_id: userId,
    prayer_name: PRAYER_NAMES[randomInt(0, 4)],
    date: randomDate(randomInt(1, 540)),
    is_recovered: Math.random() < 0.3,
  }));

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("missed_prayers")
    .insert(rows)
    .select("id");

  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}
