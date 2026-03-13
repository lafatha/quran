import { NextRequest, NextResponse } from "next/server";

const EQURAN_PRAYER_CITIES_URL = "https://equran.id/api/v2/shalat/kabkota";

interface CityApiRequest {
  province?: string;
}

interface CityApiResponse {
  code: number;
  message: string;
  data: string[] | null;
}

export async function POST(request: NextRequest) {
  let body: CityApiRequest;

  try {
    body = (await request.json()) as CityApiRequest;
  } catch {
    return NextResponse.json(
      { error: "Permintaan tidak valid." },
      { status: 400 },
    );
  }

  if (!body.province?.trim()) {
    return NextResponse.json(
      { error: "Provinsi wajib dipilih." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(EQURAN_PRAYER_CITIES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ provinsi: body.province }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Gagal mengambil daftar kota." },
        { status: 502 },
      );
    }

    const result = (await response.json()) as CityApiResponse;

    if (!result.data) {
      return NextResponse.json(
        { error: result.message || "Daftar kota tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: result.data,
    }, {
      headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600" },
    });
  } catch {
    return NextResponse.json(
      { error: "Layanan lokasi sedang tidak tersedia." },
      { status: 500 },
    );
  }
}
