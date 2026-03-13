import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import { getSurahMinutes, getSurahPages } from "@/lib/quran";

interface MarkReadInput {
  userId: string;
  surahId: number;
  totalVerses: number;
}

export async function markSurahAsRead(
  supabase: SupabaseClient<Database>,
  input: MarkReadInput,
) {
  const idempotencyKey = `${input.userId}:${input.surahId}:${new Date().toISOString().slice(0, 10)}:manual_complete`;

  await supabase.rpc("track_reading_session", {
    p_user_id: input.userId,
    p_surah_id: input.surahId,
    p_from_ayat: 1,
    p_to_ayat: input.totalVerses,
    p_verses_read: input.totalVerses,
    p_pages_read: getSurahPages(input.totalVerses),
    p_minutes_read: getSurahMinutes(input.totalVerses),
    p_source: "manual_complete",
    p_idempotency_key: idempotencyKey,
  });
}

export async function markSurahAsUnread(
  supabase: SupabaseClient<Database>,
  userId: string,
  surahId: number,
) {
  // Reset reading_state completion status for this surah.
  // We deliberately do NOT touch daily_logs or streaks — those are aggregates
  // of recorded sessions and should remain historically accurate.
  await supabase
    .from("reading_state")
    .update({
      is_completed: false,
      completed_at: null,
    })
    .eq("user_id", userId)
    .eq("surah_id", surahId);

  // Also reset legacy reading_progress for backwards-compat with existing queries
  await supabase
    .from("reading_progress")
    .update({
      is_completed: false,
      completed_at: null,
    })
    .eq("user_id", userId)
    .eq("surah_id", surahId);
}
