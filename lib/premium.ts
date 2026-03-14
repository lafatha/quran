import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";

// ─── Constants ─────────────────────────────────────────────────────────────────

export const FREE_DAILY_LIMIT = 10;
export const PREMIUM_PRICE_IDR = 20000;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PremiumStatus {
  isPremium: boolean;
  creditsUsed: number;
  creditsMax: number;
  creditsRemaining: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ─── Premium check ─────────────────────────────────────────────────────────────

export async function checkUserPremium(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("user_premium")
    .select("is_premium")
    .eq("user_id", userId)
    .single();

  return data?.is_premium ?? false;
}

// ─── Get credits for today ─────────────────────────────────────────────────────

export async function getAiCredits(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ usedCount: number; maxCount: number }> {
  const today = getTodayDateString();

  const { data } = await supabase
    .from("ai_credits")
    .select("used_count, max_count")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (!data) {
    return { usedCount: 0, maxCount: FREE_DAILY_LIMIT };
  }

  return { usedCount: data.used_count, maxCount: data.max_count };
}

// ─── Full status (used by the client API) ──────────────────────────────────────

export async function getPremiumStatus(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<PremiumStatus> {
  const isPremium = await checkUserPremium(supabase, userId);

  if (isPremium) {
    return {
      isPremium: true,
      creditsUsed: 0,
      creditsMax: FREE_DAILY_LIMIT,
      creditsRemaining: Infinity,
    };
  }

  const { usedCount, maxCount } = await getAiCredits(supabase, userId);

  return {
    isPremium: false,
    creditsUsed: usedCount,
    creditsMax: maxCount,
    creditsRemaining: Math.max(0, maxCount - usedCount),
  };
}

// ─── Decrement credit (returns false if no credits left) ───────────────────────

export async function decrementAiCredit(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const today = getTodayDateString();

  const { data: existing } = await supabase
    .from("ai_credits")
    .select("id, used_count, max_count")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (!existing) {
    await supabase.from("ai_credits").insert({
      user_id: userId,
      date: today,
      used_count: 1,
      max_count: FREE_DAILY_LIMIT,
    });
    return true;
  }

  if (existing.used_count >= existing.max_count) {
    return false;
  }

  await supabase
    .from("ai_credits")
    .update({ used_count: existing.used_count + 1 })
    .eq("id", existing.id);

  return true;
}
