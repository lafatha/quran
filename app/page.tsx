"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import FeatureGrid from "@/components/FeatureGrid";
import WeeklyCalendarStrip from "@/components/WeeklyCalendarStrip";
import {
  EMPTY_PRAYER_STATE,
  getDateKey,
  getPrayerScheduleForDay,
  getPrayerState,
} from "@/lib/prayer";
import type {
  PrayerLocationState,
  PrayerMonthSchedule,
  PrayerState,
} from "@/lib/prayer";
import { getQuranData } from "@/lib/quran";
import { createClient } from "@/lib/supabase/client";
import type { WeekDayItem } from "@/lib/types";

interface ContinueReadState {
  id: number;
  name: string;
  ayatCount: number;
  lastAyatRead: number;
  time: string;
}

interface ScheduleResponse {
  data?: PrayerMonthSchedule;
  error?: string;
}

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getWeeklyDays(
  dailyProgressMap: Map<string, number>,
  ayatGoal: number,
) {
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const items: WeekDayItem[] = [];
  const today = new Date();

  for (let index = 6; index >= 0; index -= 1) {
    const target = new Date(today);
    target.setDate(today.getDate() - index);
    const isoDate = getDateKey(target);
    const todayIso = getDateKey(today);
    const ayatRead = dailyProgressMap.get(isoDate) ?? 0;
    const progress =
      ayatGoal > 0 ? Math.min(100, Math.round((ayatRead / ayatGoal) * 100)) : 0;

    const status: WeekDayItem["status"] =
      isoDate === todayIso
        ? "today"
        : progress >= 100
          ? "completed"
          : ayatRead > 0
            ? "today"
            : "default";

    items.push({
      day: dayNames[target.getDay()],
      date: target.getDate(),
      status,
      progress,
    });
  }

  return items;
}

export default function HomePage() {
  const [weekDays, setWeekDays] = useState<WeekDayItem[]>([]);
  const [continueRead, setContinueRead] = useState<ContinueReadState | null>(
    null,
  );
  const [prayerState, setPrayerState] =
    useState<PrayerState>(EMPTY_PRAYER_STATE);
  const [prayerMonthSchedule, setPrayerMonthSchedule] =
    useState<PrayerMonthSchedule | null>(null);
  const [prayerLocation, setPrayerLocation] = useState<PrayerLocationState>({
    province: "",
    city: "",
  });
  const [prayerLoading, setPrayerLoading] = useState(false);
  const [prayerError, setPrayerError] = useState<string | null>(null);
  const [userName, setUserName] = useState("User");

  const applyPrayerSchedule = useCallback((
    date: Date,
    monthSchedule: PrayerMonthSchedule | null,
  ) => {
    const dateKey = getDateKey(date);
    const daySchedule =
      monthSchedule?.jadwal.find((item) => item.tanggal_lengkap === dateKey) ??
      null;
    const nextSchedule = getPrayerScheduleForDay(daySchedule);

    setPrayerState(getPrayerState(date, nextSchedule));

    if (!nextSchedule.length) {
      setPrayerError("Jadwal sholat hari ini belum tersedia untuk lokasi ini.");
      return;
    }

    setPrayerError(null);
  }, []);

  const loadPrayerSchedule = useCallback(async (
    location: PrayerLocationState,
    date: Date = new Date(),
  ) => {
    if (!location.province || !location.city) {
      setPrayerMonthSchedule(null);
      setPrayerState(EMPTY_PRAYER_STATE);
      return;
    }

    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const cacheKey = `prayer_schedule:${location.province}:${location.city}:${year}-${month}`;

    // Serve from localStorage instantly if available
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as PrayerMonthSchedule;
        setPrayerMonthSchedule(parsed);
        applyPrayerSchedule(date, parsed);
        return;
      }
    } catch {
      // ignore parse errors
    }

    setPrayerLoading(true);

    try {
      const response = await fetch("/api/prayer/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          province: location.province,
          city: location.city,
          month,
          year,
        }),
      });
      const result = (await response.json()) as ScheduleResponse;

      if (!response.ok || !result.data) {
        setPrayerMonthSchedule(null);
        setPrayerState(EMPTY_PRAYER_STATE);
        setPrayerError(result.error ?? "Gagal memuat jadwal sholat.");
        return;
      }

      try {
        localStorage.setItem(cacheKey, JSON.stringify(result.data));
      } catch {
        // ignore storage quota errors
      }

      setPrayerMonthSchedule(result.data);
      applyPrayerSchedule(date, result.data);
    } catch {
      setPrayerMonthSchedule(null);
      setPrayerState(EMPTY_PRAYER_STATE);
      setPrayerError("Gagal memuat jadwal sholat.");
    } finally {
      setPrayerLoading(false);
    }
  }, [applyPrayerSchedule]);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) {
        return;
      }

      const today = new Date();
      const todayIso = getDateKey(today);
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 6);

      const [
        profileResult,
        goalsResult,
        weekLogsResult,
        progressResult,
        settingsResult,
        surahs,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("user_goals")
          .select("ayat_goal, surah_goal, halaman_goal, menit_goal")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("daily_logs")
          .select("date, ayat_read")
          .eq("user_id", user.id)
          .gte("date", getDateKey(weekStart))
          .lte("date", todayIso),
        supabase
          .from("bookmarks")
          .select("surah_id, ayat_number, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("user_settings")
          .select("prayer_province, prayer_city")
          .eq("id", user.id)
          .maybeSingle(),
        getQuranData(),
      ]);

      if (profileResult.data?.name) {
        setUserName(profileResult.data.name);
      }
      const goals = goalsResult.data;
      const weekLogs = weekLogsResult.data ?? [];
      const bookmarkRow = progressResult.data;
      const settings = settingsResult.data;

      const resolvedAyatGoal = goals?.ayat_goal ?? 2500;
      const weekProgressMap = new Map<string, number>(
        weekLogs.map((item) => [item.date, item.ayat_read]),
      );
      setWeekDays(getWeeklyDays(weekProgressMap, resolvedAyatGoal));

      if (bookmarkRow) {
        const surah = surahs.find((item) => item.id === bookmarkRow.surah_id);
        setContinueRead({
          id: bookmarkRow.surah_id,
          name: surah?.transliteration ?? `Surah ${bookmarkRow.surah_id}`,
          ayatCount: surah?.total_verses ?? 0,
          lastAyatRead: bookmarkRow.ayat_number ?? 0,
          time: formatTime(bookmarkRow.updated_at),
        });
      }

      const nextLocation = {
        province: settings?.prayer_province ?? "",
        city: settings?.prayer_city ?? "",
      };

      setPrayerLocation(nextLocation);

      if (nextLocation.province && nextLocation.city) {
        await loadPrayerSchedule(nextLocation, today);
      } else {
        setPrayerError("Atur lokasi di Pengaturan agar jadwal sholat tampil.");
      }
    });
  }, [loadPrayerSchedule]);

  useEffect(() => {
    const syncPrayerState = () => {
      const now = new Date();

      if (!prayerMonthSchedule) {
        if (!prayerLocation.province || !prayerLocation.city) {
          setPrayerState(EMPTY_PRAYER_STATE);
        }

        return;
      }

      if (
        prayerMonthSchedule.bulan !== now.getMonth() + 1 ||
        prayerMonthSchedule.tahun !== now.getFullYear()
      ) {
        if (
          prayerLocation.province &&
          prayerLocation.city
        ) {
          loadPrayerSchedule(prayerLocation, now);
        }

        return;
      }

      if (
        prayerLocation.province &&
        prayerLocation.city
      ) {
        applyPrayerSchedule(now, prayerMonthSchedule);
      }
    };

    syncPrayerState();

    const intervalId = window.setInterval(syncPrayerState, 60000);
    return () => window.clearInterval(intervalId);
  }, [applyPrayerSchedule, loadPrayerSchedule, prayerLocation, prayerMonthSchedule]);

  return (
    <>
      <div className="min-h-screen bg-[linear-gradient(180deg,#eaf5f0_0%,#f4f9f6_30%,#ffffff_100%)] pb-28">
        {/* Header */}
        <div className="px-5 pt-6 pb-2">
          <p className="text-[19px] font-semibold tracking-tight text-gray-950">
            Assalamualaikum, {userName}
          </p>
        </div>

        {/* Weekly Calendar */}
        <div className="mt-4 px-4">
          <WeeklyCalendarStrip days={weekDays} />
        </div>

        {/* Row 1: Next Prayer + Lanjut Baca compact */}
        <div className="mt-4 px-4 grid grid-cols-2 gap-3">
          {/* Next Prayer card */}
          <div className="relative overflow-hidden rounded-2xl bg-emerald-100 border border-emerald-200/80 p-4 shadow-sm">
            <div
              className="pointer-events-none absolute top-2 bottom-0 right-0 w-1/2 bg-[url('/masjid.png')] bg-no-repeat [background-position:calc(100%+0.75rem)_1rem] bg-contain opacity-40"
              aria-hidden="true"
            />
            <div className="flex items-center gap-2 mb-2">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 text-emerald-700"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                Next {prayerState.nextPrayerName}
              </span>
            </div>
            {prayerLocation.province && prayerLocation.city ? (
              <>
                <p className="text-2xl font-bold tracking-tight text-gray-950">
                  {prayerLoading ? "--:--" : prayerState.nextPrayerTime}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  {prayerError ?? prayerState.countdown}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-700">--:--</p>
                <p className="mt-1 text-xs text-gray-600">
                  Atur lokasi di Pengaturan agar jadwal sholat tampil.
                </p>
              </>
            )}
          </div>

          {/* Lanjut Baca compact */}
          <Link
            href={continueRead ? `/quran/${continueRead.id}` : "/quran"}
            className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm flex flex-col justify-between transition-colors hover:bg-amber-100"
          >
            <div
              className="pointer-events-none absolute top-2 bottom-0 right-0 w-[170%] bg-[url('/quran.png')] bg-no-repeat [background-position:calc(100%+1.5rem)_2rem] bg-contain opacity-40"
              aria-hidden="true"
            />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
              Lanjut Baca
            </span>
            <p className="mt-1 text-sm font-bold tracking-tight text-gray-950 truncate">
              {continueRead?.name ?? "Mulai bacaan pertama"}
            </p>
            <span className="mt-2 text-xs flex items-center gap-0.5 text-amber-600">
              {continueRead ? `Ayat ${continueRead.lastAyatRead}` : "Belum ada riwayat"}
              <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
            </span>
          </Link>
        </div>

        {/* Row 2: Feature grid */}
        <div className="mt-4 px-4">
          <FeatureGrid />
        </div>

        {/* Doa hari ini */}
        <div className="mt-4 px-4">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-4 py-5">
            <p className="text-[15px] font-bold text-gray-900">
              Doa hari ini
            </p>
            <p className="arabic-text text-xl leading-loose mt-3 text-gray-900">
              وَتُبْ عَلَيْنَا إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-gray-700">
              Ya Tuhan kami, terimalah daripada kami (amalan kami),
              sesungguhnya Engkaulah Yang Maha Mendengar lagi Maha Mengetahui.
              Dan terimalah taubat kami. Sesungguhnya Engkaulah Yang Maha
              Penerima taubat lagi Maha Penyayang.
            </p>
            <p className="mt-3 text-[12px] font-medium text-gray-400">
              QS. Al Baqarah [2]: 127–128
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
