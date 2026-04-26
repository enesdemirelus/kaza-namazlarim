"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import type { MissedPrayer, PrayerName } from "@/lib/types/database";

function getSupabase() {
  return createServerSupabaseClient();
}

// Ensures the signed-in user exists in the users table.
export async function upsertUser(): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const email =
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ?? null;

  const supabase = getSupabase();
  const { error } = await supabase.from("users").upsert(
    { id: userId, email },
    { onConflict: "id" }
  );

  if (error) throw new Error(error.message);
}

// Returns all missed prayers for the signed-in user, newest first.
export async function getMissedPrayers(): Promise<MissedPrayer[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("missed_prayers")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as MissedPrayer[];
}

// Adds a missed prayer entry. Date defaults to today if omitted.
export async function addMissedPrayer(
  prayerName: PrayerName,
  date?: string
): Promise<MissedPrayer> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await upsertUser();

  const prayerDate = date ?? new Date().toISOString().slice(0, 10);

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("missed_prayers")
    .insert({ user_id: userId, prayer_name: prayerName, date: prayerDate })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as MissedPrayer;
}

// Marks a missed prayer as recovered.
export async function markPrayerRecovered(prayerId: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = getSupabase();
  const { error } = await supabase
    .from("missed_prayers")
    .update({ is_recovered: true })
    .eq("id", prayerId)
    .eq("user_id", userId); // prevents touching other users' data

  if (error) throw new Error(error.message);
}

// Deletes a missed prayer record.
export async function deleteMissedPrayer(prayerId: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = getSupabase();
  const { error } = await supabase
    .from("missed_prayers")
    .delete()
    .eq("id", prayerId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
