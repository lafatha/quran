import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import { getSurahMinutes, getSurahPages } from "@/lib/quran";

interface MarkReadInput {
  userId: string;
  surahId: number;
  totalVerses: number;
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getYesterdayDateString() {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function markSurahAsRead(
  supabase: SupabaseClient<Database>,
  input: MarkReadInput,
) {
  const today = getTodayDateString();

  await supabase.from("reading_progress").upsert(
    {
      user_id: input.userId,
      surah_id: input.surahId,
      is_completed: true,
      last_ayat_read: input.totalVerses,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,surah_id" },
  );

  const { data: todayLog } = await supabase
    .from("daily_logs")
    .select("id, ayat_read, surah_read, halaman_read, minutes_read")
    .eq("user_id", input.userId)
    .eq("date", today)
    .maybeSingle();

  if (todayLog) {
    await supabase
      .from("daily_logs")
      .update({
        ayat_read: todayLog.ayat_read + input.totalVerses,
        surah_read: todayLog.surah_read + 1,
        halaman_read: todayLog.halaman_read + getSurahPages(input.totalVerses),
        minutes_read: todayLog.minutes_read + getSurahMinutes(input.totalVerses),
      })
      .eq("id", todayLog.id);
  } else {
    await supabase.from("daily_logs").insert({
      user_id: input.userId,
      date: today,
      ayat_read: input.totalVerses,
      surah_read: 1,
      halaman_read: getSurahPages(input.totalVerses),
      minutes_read: getSurahMinutes(input.totalVerses),
    });
  }

  const { data: streak } = await supabase
    .from("streaks")
    .select("id, current_streak, longest_streak, last_read_date")
    .eq("user_id", input.userId)
    .maybeSingle();

  const yesterday = getYesterdayDateString();

  if (!streak) {
    await supabase.from("streaks").insert({
      user_id: input.userId,
      current_streak: 1,
      longest_streak: 1,
      last_read_date: today,
    });
    return;
  }

  if (streak.last_read_date === today) {
    return;
  }

  const currentStreak = streak.last_read_date === yesterday ? streak.current_streak + 1 : 1;
  const longestStreak = Math.max(streak.longest_streak, currentStreak);

  await supabase
    .from("streaks")
    .update({
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_read_date: today,
    })
    .eq("id", streak.id);
}

export async function markSurahAsUnread(
  supabase: SupabaseClient<Database>,
  userId: string,
  surahId: number,
) {
  await supabase
    .from("reading_progress")
    .update({
      is_completed: false,
      completed_at: null,
    })
    .eq("user_id", userId)
    .eq("surah_id", surahId);
}
