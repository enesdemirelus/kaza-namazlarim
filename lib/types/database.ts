export type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

export const PRAYER_NAMES: PrayerName[] = [
  "Fajr",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
];

export interface DbUser {
  id: string; // Clerk user ID
  email: string | null;
  created_at: string;
}

export interface MissedPrayer {
  id: string;
  user_id: string;
  prayer_name: PrayerName;
  date: string; // ISO date string: "YYYY-MM-DD"
  is_recovered: boolean;
  created_at: string;
}

export type NewMissedPrayer = Pick<MissedPrayer, "prayer_name" | "date">;
