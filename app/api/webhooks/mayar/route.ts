import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";

interface MayarWebhookPayload {
  event: string;
  data: {
    id: string;
    status: string;
    customerName: string;
    customerEmail: string;
    amount: number;
    extraData?: {
      noCustomer?: string;
      idProd?: string;
    };
  };
}

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return createClient<Database>(url, serviceKey);
}

export async function POST(req: NextRequest): Promise<Response> {
  let payload: MayarWebhookPayload;
  try {
    payload = (await req.json()) as MayarWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (payload.event !== "payment.received") {
    return NextResponse.json({ received: true, skipped: true });
  }

  const userId = payload.data.extraData?.noCustomer;
  const productId = payload.data.extraData?.idProd;

  if (!userId || productId !== "mufasir-premium") {
    return NextResponse.json({ received: true, skipped: true });
  }

  const supabase = createServiceClient();

  const { error } = await supabase
    .from("user_premium")
    .upsert(
      {
        user_id: userId,
        is_premium: true,
        paid_at: new Date().toISOString(),
        mayar_invoice_id: payload.data.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) {
    console.error("Failed to update premium status:", error);
    return NextResponse.json(
      { error: "Database update failed" },
      { status: 500 },
    );
  }

  console.log(`[Premium] User ${userId} upgraded to premium via invoice ${payload.data.id}`);

  return NextResponse.json({ received: true, upgraded: true });
}
