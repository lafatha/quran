import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PREMIUM_PRICE_IDR } from "@/lib/premium";

const MAYAR_API_URL = "https://api.mayar.id/hl/v1/invoice/create";

interface MayarInvoiceResponse {
  statusCode: number;
  messages: string;
  data: {
    id: string;
    transactionId: string;
    link: string;
    expiredAt: string;
  };
}

export async function POST(req: NextRequest): Promise<Response> {
  const mayarApiKey = process.env.MAYAR_API_KEY;
  if (!mayarApiKey) {
    return NextResponse.json(
      { error: "Payment service not configured" },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; mobile?: string };
  try {
    body = (await req.json()) as { name?: string; mobile?: string };
  } catch {
    body = {};
  }

  const customerName = body.name || user.user_metadata?.name || user.email || "User";
  const customerEmail = user.email || "";
  const customerMobile = body.mobile || "000000000000";

  const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const redirectUrl = `${req.nextUrl.origin}/ai-chat?upgraded=true`;

  const invoicePayload = {
    name: customerName,
    email: customerEmail,
    mobile: customerMobile,
    redirectUrl,
    description: "Mufasir Premium — Akses AI tanpa batas",
    expiredAt,
    items: [
      {
        quantity: 1,
        rate: PREMIUM_PRICE_IDR,
        description: "Mufasir Premium — Unlimited AI Prompts",
      },
    ],
    extraData: {
      noCustomer: user.id,
      idProd: "mufasir-premium",
    },
  };

  try {
    const mayarRes = await fetch(MAYAR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mayarApiKey}`,
      },
      body: JSON.stringify(invoicePayload),
    });

    if (!mayarRes.ok) {
      const errText = await mayarRes.text();
      console.error("Mayar API error:", mayarRes.status, errText);
      return NextResponse.json(
        { error: "Failed to create invoice" },
        { status: 502 },
      );
    }

    const result = (await mayarRes.json()) as MayarInvoiceResponse;

    return NextResponse.json({
      invoiceId: result.data.id,
      paymentLink: result.data.link,
      expiredAt: result.data.expiredAt,
    });
  } catch (err) {
    console.error("Mayar invoice creation failed:", err);
    return NextResponse.json(
      { error: "Payment service unavailable" },
      { status: 502 },
    );
  }
}
