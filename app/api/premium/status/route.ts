import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPremiumStatus } from "@/lib/premium";

export async function GET(): Promise<Response> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getPremiumStatus(supabase, user.id);

  return NextResponse.json({
    isPremium: status.isPremium,
    creditsUsed: status.creditsUsed,
    creditsMax: status.creditsMax,
    creditsRemaining: status.isPremium ? null : status.creditsRemaining,
  });
}
