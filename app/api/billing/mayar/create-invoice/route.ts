import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Base URL sesuai docs.mayar.id: Sandbox https://api.mayar.club/hl/v1, Production https://api.mayar.id/hl/v1
const MAYAR_BASE =
  process.env.MAYAR_SANDBOX === "true"
    ? "https://api.mayar.club/hl/v1"
    : "https://api.mayar.id/hl/v1";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  let body: { userId?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const userId =
    body && typeof body.userId === "string" && body.userId.trim()
      ? body.userId.trim()
      : null;

  if (!userId) {
    return NextResponse.json(
      {
        error:
          "Permintaan tidak valid. Kirim body JSON: { \"userId\": \"<id user>\" }.",
      },
      { status: 400 },
    );
  }

  const { data: existing } = await supabase
    .from("premium_subscriptions")
    .select("is_premium, mayar_invoice_id, mayar_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.is_premium) {
    return NextResponse.json(
      { error: "Akun Anda sudah premium." },
      { status: 409 },
    );
  }

  const apiKey = process.env.MAYAR_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Konfigurasi pembayaran belum lengkap." },
      { status: 500 },
    );
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", userId)
      .maybeSingle();

    const customerName =
      (profile?.name && String(profile.name).trim()) || "Pengguna Mufassir";
    const customerEmail =
      (profile?.email && String(profile.email).trim()) || "customer@mufassir.app";

    const reference = `mufassir-premium-${userId}-${Date.now()}`;
    const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const res = await fetch(`${MAYAR_BASE}/invoice/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: customerName,
        email: customerEmail,
        mobile: "081234567890",
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/settings`,
        description: "Upgrade Premium Mufassir AI - akses tanpa batas",
        expiredAt,
        items: [
          {
            quantity: 1,
            rate: 20000,
            description: "Mufassir Premium - Tanya AI tanpa batas",
          },
        ],
        extraData: {
          reference,
          user_id: userId,
        },
      }),
    });

    let json: {
      statusCode?: number;
      data?: { id: string; transactionId?: string; link: string };
      messages?: string;
    };
    try {
      json = (await res.json()) as typeof json;
    } catch {
      json = {};
    }

    if (!res.ok || json.statusCode !== 200 || !json.data) {
      const mayarMessage = json.messages ?? (typeof json === "object" && json !== null ? String(json) : "");
      console.error(
        "[Mayar create-invoice]",
        res.status,
        res.statusText,
        "URL:",
        MAYAR_BASE + "/invoice/create",
        "Body:",
        JSON.stringify(json),
      );
      const message =
        res.status === 401
          ? "API key Mayar tidak valid atau base URL tidak sesuai (Sandbox vs Production). Cek .env MAYAR_API_KEY dan MAYAR_SANDBOX."
          : mayarMessage || "Tidak dapat membuat invoice pembayaran.";
      return NextResponse.json(
        {
          error: message,
          debug:
            process.env.NODE_ENV === "development"
              ? { mayarStatus: res.status, mayarMessage: mayarMessage || undefined, mayarBody: json }
              : undefined,
        },
        { status: 502 },
      );
    }

    const invoiceId = json.data.id;
    const paymentUrl = json.data.link;

    if (!invoiceId || !paymentUrl) {
      return NextResponse.json(
        { error: "Tidak dapat membuat invoice pembayaran." },
        { status: 502 },
      );
    }

    const upsertPayload = {
      user_id: userId,
      is_premium: false,
      activated_at: null,
      provider: "mayar",
      mayar_invoice_id: invoiceId,
      mayar_status: "pending",
    };

    const { error: upsertError } = await supabase
      .from("premium_subscriptions")
      .upsert(upsertPayload, {
        onConflict: "user_id",
      });

    if (upsertError) {
      console.error("[Mayar create-invoice] Supabase upsert error:", upsertError);
      return NextResponse.json(
        {
          error: "Gagal menyimpan data langganan.",
          debug:
            process.env.NODE_ENV === "development"
              ? { supabaseError: upsertError.message, code: upsertError.code }
              : undefined,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        invoiceId,
        paymentUrl,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Terjadi kesalahan saat membuat invoice. Silakan coba beberapa saat lagi.",
      },
      { status: 500 },
    );
  }
}

