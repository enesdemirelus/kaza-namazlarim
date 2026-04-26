import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import type { PrayerName } from "@/lib/types/database";

const PRAYER_NAMES: PrayerName[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerSupabaseClient();

  // Generate 55 fake entries spread over the last 18 months
  const rows = Array.from({ length: 55 }, () => ({
    user_id: userId,
    prayer_name: PRAYER_NAMES[randomInt(0, 4)],
    date: randomDate(randomInt(1, 540)),
    is_recovered: Math.random() < 0.3, // ~30% recovered
  }));

  const { data, error } = await supabase
    .from("missed_prayers")
    .insert(rows)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ inserted: data?.length ?? 0 });
}
