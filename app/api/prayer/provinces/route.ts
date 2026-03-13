import { NextResponse } from "next/server";

const EQURAN_PRAYER_PROVINCES_URL = "https://equran.id/api/v2/shalat/provinsi";

interface ProvinceApiResponse {
  code: number;
  message: string;
  data: string[];
}

export async function GET() {
  try {
    const response = await fetch(EQURAN_PRAYER_PROVINCES_URL, {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 43200,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Gagal mengambil daftar provinsi." },
        { status: 502 },
      );
    }

    const result = (await response.json()) as ProvinceApiResponse;

    return NextResponse.json({
      data: result.data ?? [],
    });
  } catch {
    return NextResponse.json(
      { error: "Layanan lokasi sedang tidak tersedia." },
      { status: 500 },
    );
  }
}
