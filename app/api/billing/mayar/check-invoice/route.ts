import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Base URL sesuai docs.mayar.id: Sandbox https://api.mayar.club/hl/v1, Production https://api.mayar.id/hl/v1
const MAYAR_BASE =
  process.env.MAYAR_SANDBOX === "true"
    ? "https://api.mayar.club/hl/v1"
    : "https://api.mayar.id/hl/v1";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const body = await req.json().catch(() => null);
  const invoiceId: string | undefined = body?.invoiceId;
  const userId: string | undefined = body?.userId;

  if (!invoiceId || !userId) {
    return NextResponse.json(
      { error: "Permintaan tidak valid." },
      { status: 400 },
    );
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("premium_subscriptions")
    .select("id, user_id, is_premium, mayar_invoice_id, mayar_status")
    .eq("user_id", userId)
    .eq("mayar_invoice_id", invoiceId)
    .maybeSingle();

  if (subscriptionError || !subscription) {
    return NextResponse.json(
      { error: "Invoice tidak ditemukan untuk akun ini." },
      { status: 404 },
    );
  }

  const apiKey = process.env.MAYAR_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Konfigurasi pembayaran belum lengkap." },
      { status: 500 },
    );
  }

  if (subscription.is_premium && subscription.mayar_status === "paid") {
    return NextResponse.json(
      { status: "paid", isPremium: true },
      { status: 200 },
    );
  }

  try {
    const res = await fetch(
      `${MAYAR_BASE}/invoice/${encodeURIComponent(invoiceId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    const json = (await res.json()) as {
      statusCode?: number;
      data?: { status?: string };
    };

    const status: string =
      json.data?.status ?? "unknown";

    if (status === "paid" || status === "success") {
      const { error: updateError } = await supabase
        .from("premium_subscriptions")
        .update({
          is_premium: true,
          activated_at: new Date().toISOString(),
          mayar_status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id);

      if (updateError) {
        return NextResponse.json(
          { error: "Gagal memperbarui status premium." },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { status: "paid", isPremium: true },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        status,
        isPremium: false,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Terjadi kesalahan saat memeriksa status pembayaran. Silakan coba lagi.",
      },
      { status: 500 },
    );
  }
}

