import { NextRequest, NextResponse } from "next/server";
import type { PrayerMonthSchedule } from "@/lib/prayer";

const EQURAN_PRAYER_SCHEDULE_URL = "https://equran.id/api/v2/shalat";

interface ScheduleApiRequest {
  province?: string;
  city?: string;
  month?: number;
  year?: number;
}

interface ScheduleApiResponse {
  code: number;
  message: string;
  data: PrayerMonthSchedule | null;
}

export async function POST(request: NextRequest) {
  let body: ScheduleApiRequest;

  try {
    body = (await request.json()) as ScheduleApiRequest;
  } catch {
    return NextResponse.json(
      { error: "Permintaan tidak valid." },
      { status: 400 },
    );
  }

  if (!body.province?.trim() || !body.city?.trim()) {
    return NextResponse.json(
      { error: "Provinsi dan kota wajib dipilih." },
      { status: 400 },
    );
  }

  const today = new Date();
  const month = body.month ?? today.getMonth() + 1;
  const year = body.year ?? today.getFullYear();

  try {
    const response = await fetch(EQURAN_PRAYER_SCHEDULE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        provinsi: body.province,
        kabkota: body.city,
        bulan: month,
        tahun: year,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Gagal mengambil jadwal sholat." },
        { status: 502 },
      );
    }

    const result = (await response.json()) as ScheduleApiResponse;

    if (!result.data) {
      return NextResponse.json(
        { error: result.message || "Jadwal sholat tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: result.data,
    }, {
      headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json(
      { error: "Layanan jadwal sholat sedang tidak tersedia." },
      { status: 500 },
    );
  }
}
