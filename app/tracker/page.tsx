"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  getCurrentPrayerName,
  getDateKey,
  getPrayerScheduleForDay,
} from "@/lib/prayer";
import type {
  PrayerLocationState,
  PrayerMonthSchedule,
  PrayerScheduleItem,
} from "@/lib/prayer";
import { createClient } from "@/lib/supabase/client";

interface ScheduleResponse {
  data?: PrayerMonthSchedule;
  error?: string;
}

const PRAYER_LABELS: PrayerScheduleItem[] = [
  { label: "Subuh", time: "--:--" },
  { label: "Dzuhur", time: "--:--" },
  { label: "Ashar", time: "--:--" },
  { label: "Maghrib", time: "--:--" },
  { label: "Isya", time: "--:--" },
];

const PRAYER_DESCRIPTIONS: Record<string, string> = {
  Subuh: "Sholat fajar, dua rakaat sebelum terbit matahari.",
  Dzuhur: "Sholat tengah hari, empat rakaat setelah matahari tergelincir.",
  Ashar: "Sholat sore, empat rakaat saat bayangan sama panjang dengan benda.",
  Maghrib: "Sholat setelah matahari terbenam, tiga rakaat.",
  Isya: "Sholat malam, empat rakaat setelah syafak hilang.",
};

export default function TrackerPage() {
  const [location, setLocation] = useState<PrayerLocationState>({
    province: "",
    city: "",
  });
  const [schedule, setSchedule] = useState<PrayerScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) {
        setLoading(false);
        return;
      }

      const settingsResult = await supabase
        .from("user_settings")
        .select("prayer_province, prayer_city")
        .eq("id", user.id)
        .maybeSingle();

      const province = settingsResult.data?.prayer_province ?? "";
      const city = settingsResult.data?.prayer_city ?? "";
      const nextLocation = { province, city };
      setLocation(nextLocation);

      if (!province || !city) {
        setSchedule([]);
        setError("Atur lokasi di Pengaturan agar jadwal sholat tampil.");
        setLoading(false);
        return;
      }

      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      const cacheKey = `prayer_schedule:${province}:${city}:${year}-${month}`;

      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as PrayerMonthSchedule;
          const dateKey = getDateKey(today);
          const daySchedule =
            parsed.jadwal.find((item) => item.tanggal_lengkap === dateKey) ?? null;
          setSchedule(getPrayerScheduleForDay(daySchedule));
          setError(null);
          setLoading(false);
          return;
        }
      } catch {
        // ignore
      }

      try {
        const response = await fetch("/api/prayer/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ province, city, month, year }),
        });
        const result = (await response.json()) as ScheduleResponse;

        if (!response.ok || !result.data) {
          setSchedule([]);
          setError(result.error ?? "Gagal memuat jadwal sholat.");
          setLoading(false);
          return;
        }

        try {
          localStorage.setItem(cacheKey, JSON.stringify(result.data));
        } catch {
          // ignore
        }

        const dateKey = getDateKey(today);
        const daySchedule =
          result.data.jadwal.find((item) => item.tanggal_lengkap === dateKey) ?? null;
        setSchedule(getPrayerScheduleForDay(daySchedule));
        setError(null);
      } catch {
        setSchedule([]);
        setError("Gagal memuat jadwal sholat.");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  const displaySchedule = schedule.length ? schedule : PRAYER_LABELS;
  const currentPrayerName = getCurrentPrayerName(now, displaySchedule);
  const locationLabel = location.city && location.province
    ? `${location.city}, ${location.province}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Kembali"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </Link>
          <h1 className="text-lg font-bold tracking-tight text-gray-950">
            Jadwal Sholat
          </h1>
        </div>
      </div>

      <div className="px-4 py-5">
        {locationLabel && (
          <p className="mb-4 text-[13px] text-gray-500">
            {locationLabel}
          </p>
        )}
        {error && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            {error}
            <Link
              href="/settings"
              className="mt-2 block font-semibold text-amber-700 underline"
            >
              Buka Pengaturan
            </Link>
          </div>
        )}
        {loading ? (
          <p className="text-[13px] text-gray-400">Memuat jadwal…</p>
        ) : (
          <div className="space-y-3">
            {displaySchedule.map((item) => {
              const isCurrent = currentPrayerName === item.label;
              const description = PRAYER_DESCRIPTIONS[item.label];

              return (
                <div
                  key={item.label}
                  className={`rounded-2xl border px-4 py-3.5 shadow-sm ${
                    isCurrent
                      ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200/60"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[15px] font-semibold ${
                            isCurrent ? "text-emerald-900" : "text-gray-900"
                          }`}
                        >
                          {item.label}
                        </span>
                        {isCurrent && (
                          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                            Sekarang
                          </span>
                        )}
                      </div>
                      {description && (
                        <p
                          className={`mt-1.5 text-[13px] leading-snug ${
                            isCurrent ? "text-emerald-800/90" : "text-gray-500"
                          }`}
                        >
                          {description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 text-[15px] font-semibold tabular-nums ${
                        isCurrent ? "text-emerald-800" : "text-gray-700"
                      }`}
                    >
                      {item.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
