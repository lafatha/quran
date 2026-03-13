"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  Clock3,
  HandHeart,
  MapPin,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import PrayerLocationForm from "@/components/PrayerLocationForm";
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
  PrayerScheduleItem,
  PrayerState,
} from "@/lib/prayer";
import { getQuranData } from "@/lib/quran";
import { createClient } from "@/lib/supabase/client";
import type { WeekDayItem } from "@/lib/types";

interface DailyProgressState {
  ayatRead: number;
  ayatGoal: number;
  surahRead: number;
  surahGoal: number;
  halamanRead: number;
  halamanGoal: number;
  menitRead: number;
  menitGoal: number;
  streak: number;
}

interface ContinueReadState {
  id: number;
  name: string;
  ayatCount: number;
  lastAyatRead: number;
  time: string;
}

interface ShortcutItem {
  href: string;
  label: string;
  caption: string;
  icon: typeof BookOpen;
  gradient: string;
  shadow: string;
}

interface ProvinceResponse {
  data?: string[];
  error?: string;
}

interface CityResponse {
  data?: string[];
  error?: string;
}

interface ScheduleResponse {
  data?: PrayerMonthSchedule;
  error?: string;
}

const fallbackProgress: DailyProgressState = {
  ayatRead: 0,
  ayatGoal: 2500,
  surahRead: 0,
  surahGoal: 150,
  halamanRead: 0,
  halamanGoal: 275,
  menitRead: 0,
  menitGoal: 70,
  streak: 0,
};

const fallbackPrayerSchedule: PrayerScheduleItem[] = [
  { label: "Subuh", time: "--:--" },
  { label: "Dzuhur", time: "--:--" },
  { label: "Ashar", time: "--:--" },
  { label: "Maghrib", time: "--:--" },
  { label: "Isya", time: "--:--" },
];

const shortcuts: ShortcutItem[] = [
  {
    href: "/quran",
    label: "Al-Quran",
    caption: "Baca 114 surah",
    icon: BookOpen,
    gradient: "from-emerald-800 to-teal-700",
    shadow: "shadow-emerald-950/30",
  },
  {
    href: "/doa",
    label: "Doa & Dzikir",
    caption: "227 doa pilihan",
    icon: HandHeart,
    gradient: "from-amber-700 to-amber-500",
    shadow: "shadow-amber-900/25",
  },
  {
    href: "/ai-chat",
    label: "AI Guide",
    caption: "Tanya cepat",
    icon: Sparkles,
    gradient: "from-indigo-700 to-violet-600",
    shadow: "shadow-indigo-950/25",
  },
  {
    href: "/progress",
    label: "Statistik",
    caption: "Laporan bacaan",
    icon: BarChart3,
    gradient: "from-slate-700 to-slate-600",
    shadow: "shadow-slate-900/20",
  },
];

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

function getProgressWidth(value: number, goal: number) {
  if (goal <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((value / goal) * 100));
}

export default function HomePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [progress, setProgress] =
    useState<DailyProgressState>(fallbackProgress);
  const [weekDays, setWeekDays] = useState<WeekDayItem[]>([]);
  const [continueRead, setContinueRead] = useState<ContinueReadState | null>(
    null,
  );
  const [prayerState, setPrayerState] =
    useState<PrayerState>(EMPTY_PRAYER_STATE);
  const [prayerSchedule, setPrayerSchedule] = useState<PrayerScheduleItem[]>(
    [],
  );
  const [prayerMonthSchedule, setPrayerMonthSchedule] =
    useState<PrayerMonthSchedule | null>(null);
  const [prayerLocation, setPrayerLocation] = useState<PrayerLocationState>({
    province: "",
    city: "",
  });
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [provinceLoading, setProvinceLoading] = useState(true);
  const [cityLoading, setCityLoading] = useState(false);
  const [prayerLoading, setPrayerLoading] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [prayerError, setPrayerError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  async function fetchProvinces() {
    setProvinceLoading(true);

    try {
      const response = await fetch("/api/prayer/provinces");
      const result = (await response.json()) as ProvinceResponse;

      if (!response.ok) {
        setLocationError(result.error ?? "Gagal memuat daftar provinsi.");
        setProvinces([]);
        return [] as string[];
      }

      setLocationError(null);
      const nextProvinces = result.data ?? [];
      setProvinces(nextProvinces);
      return nextProvinces;
    } catch {
      setLocationError("Gagal memuat daftar provinsi.");
      setProvinces([]);
      return [] as string[];
    } finally {
      setProvinceLoading(false);
    }
  }

  async function fetchCities(province: string) {
    if (!province) {
      setCities([]);
      return [] as string[];
    }

    setCityLoading(true);

    try {
      const response = await fetch("/api/prayer/cities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ province }),
      });
      const result = (await response.json()) as CityResponse;

      if (!response.ok) {
        setLocationError(result.error ?? "Gagal memuat daftar kota.");
        setCities([]);
        return [] as string[];
      }

      setLocationError(null);
      const nextCities = result.data ?? [];
      setCities(nextCities);
      return nextCities;
    } catch {
      setLocationError("Gagal memuat daftar kota.");
      setCities([]);
      return [] as string[];
    } finally {
      setCityLoading(false);
    }
  }

  const applyPrayerSchedule = useCallback((
    date: Date,
    monthSchedule: PrayerMonthSchedule | null,
  ) => {
    const dateKey = getDateKey(date);
    const daySchedule =
      monthSchedule?.jadwal.find((item) => item.tanggal_lengkap === dateKey) ??
      null;
    const nextSchedule = getPrayerScheduleForDay(daySchedule);

    setPrayerSchedule(nextSchedule);
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
      setPrayerSchedule([]);
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
        setPrayerSchedule([]);
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
      setPrayerSchedule([]);
      setPrayerState(EMPTY_PRAYER_STATE);
      setPrayerError("Gagal memuat jadwal sholat.");
    } finally {
      setPrayerLoading(false);
    }
  }, [applyPrayerSchedule]);

  useEffect(() => {
    // Kick off provinces fetch (for modal form) — fire and forget, non-blocking
    fetchProvinces();

    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) {
        return;
      }

      setUserId(user.id);

      const today = new Date();
      const todayIso = getDateKey(today);
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 6);

      // Run ALL queries in parallel: Supabase + prayer settings together
      const [
        goalsResult,
        streakResult,
        todayLogResult,
        weekLogsResult,
        progressResult,
        settingsResult,
        surahs,
      ] = await Promise.all([
        supabase
          .from("user_goals")
          .select("ayat_goal, surah_goal, halaman_goal, menit_goal")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("streaks")
          .select("current_streak")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("daily_logs")
          .select("ayat_read, surah_read, halaman_read, minutes_read")
          .eq("user_id", user.id)
          .eq("date", todayIso)
          .maybeSingle(),
        supabase
          .from("daily_logs")
          .select("date, ayat_read")
          .eq("user_id", user.id)
          .gte("date", getDateKey(weekStart))
          .lte("date", todayIso),
        supabase
          .from("reading_state")
          .select("surah_id, last_ayat_read, last_read_at")
          .eq("user_id", user.id)
          .order("last_read_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("user_settings")
          .select("prayer_province, prayer_city")
          .eq("id", user.id)
          .maybeSingle(),
        getQuranData(),
      ]);

      const goals = goalsResult.data;
      const streak = streakResult.data;
      const todayLog = todayLogResult.data;
      const weekLogs = weekLogsResult.data ?? [];
      const continueRow = progressResult.data;
      const settings = settingsResult.data;

      setProgress({
        ayatRead: todayLog?.ayat_read ?? 0,
        ayatGoal: goals?.ayat_goal ?? 2500,
        surahRead: todayLog?.surah_read ?? 0,
        surahGoal: goals?.surah_goal ?? 150,
        halamanRead: todayLog?.halaman_read ?? 0,
        halamanGoal: goals?.halaman_goal ?? 275,
        menitRead: todayLog?.minutes_read ?? 0,
        menitGoal: goals?.menit_goal ?? 70,
        streak: streak?.current_streak ?? 0,
      });

      const resolvedAyatGoal = goals?.ayat_goal ?? 2500;
      const weekProgressMap = new Map<string, number>(
        weekLogs.map((item) => [item.date, item.ayat_read]),
      );
      setWeekDays(getWeeklyDays(weekProgressMap, resolvedAyatGoal));

      if (continueRow) {
        const surah = surahs.find((item) => item.id === continueRow.surah_id);
        setContinueRead({
          id: continueRow.surah_id,
          name: surah?.transliteration ?? `Surah ${continueRow.surah_id}`,
          ayatCount: surah?.total_verses ?? 0,
          lastAyatRead: continueRow.last_ayat_read ?? 0,
          time: formatTime(continueRow.last_read_at),
        });
      }

      const nextLocation = {
        province: settings?.prayer_province ?? "",
        city: settings?.prayer_city ?? "",
      };

      setPrayerLocation(nextLocation);

      if (!nextLocation.province || !nextLocation.city) {
        setShowLocationModal(true);
        setPrayerError("Pilih lokasi terlebih dahulu agar jadwal sholat sesuai kotamu.");
        return;
      }

      // Load prayer schedule immediately — no cities round-trip needed on initial load
      // loadPrayerSchedule serves from localStorage cache if available (instant)
      await loadPrayerSchedule(nextLocation, today);
    });
  }, [loadPrayerSchedule]);

  useEffect(() => {
    const syncPrayerState = () => {
      const now = new Date();

      if (!prayerMonthSchedule) {
        if (!prayerLocation.province || !prayerLocation.city) {
          setPrayerSchedule([]);
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

  async function handleProvinceChange(value: string) {
    setPrayerLocation({
      province: value,
      city: "",
    });
    setLocationError(null);
    await fetchCities(value);
  }

  function handleCityChange(value: string) {
    setPrayerLocation((prev) => ({
      ...prev,
      city: value,
    }));
    setLocationError(null);
  }

  async function savePrayerLocation() {
    if (!userId || !prayerLocation.province || !prayerLocation.city) {
      return;
    }

    setSavingLocation(true);

    try {
      const supabase = createClient();
      await supabase.from("user_settings").upsert({
        id: userId,
        prayer_province: prayerLocation.province,
        prayer_city: prayerLocation.city,
      });

      setShowLocationModal(false);
      setPrayerError(null);
      await loadPrayerSchedule(prayerLocation, new Date());
    } catch {
      setLocationError("Gagal menyimpan lokasi sholat.");
    } finally {
      setSavingLocation(false);
    }
  }

  const ayatProgress = getProgressWidth(progress.ayatRead, progress.ayatGoal);
  const continueProgress = continueRead
    ? getProgressWidth(continueRead.lastAyatRead, continueRead.ayatCount)
    : 0;
  const displayPrayerSchedule = prayerSchedule.length
    ? prayerSchedule
    : fallbackPrayerSchedule;
  const prayerLocationLabel = prayerLocation.city && prayerLocation.province
    ? `${prayerLocation.city}, ${prayerLocation.province}`
    : "Lokasi belum diatur";

  return (
    <>
      <div className="min-h-screen bg-[linear-gradient(180deg,#eaf5f0_0%,#f4f9f6_30%,#ffffff_100%)] pb-28">
        {/* Header */}
        <div className="px-5 pt-6 pb-2">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[1.9rem] font-bold tracking-tight leading-none text-emerald-950">
              Quran AI
            </h1>
            <div className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-600 px-3.5 py-2.5 shadow-lg shadow-emerald-900/25">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="currentColor"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="13"
                  r="8"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                />
                <circle cx="12" cy="5" r="1.4" fill="white" />
                <circle cx="17.7" cy="7.3" r="1.4" fill="white" />
                <circle cx="20" cy="13" r="1.4" fill="white" />
                <circle cx="17.7" cy="18.7" r="1.4" fill="white" />
                <circle cx="12" cy="21" r="1.4" fill="white" />
                <circle cx="6.3" cy="18.7" r="1.4" fill="white" />
                <circle cx="4" cy="13" r="1.4" fill="white" />
                <circle cx="6.3" cy="7.3" r="1.4" fill="white" />
                <path
                  d="M12 5 L12 2.5"
                  stroke="white"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="12" cy="1.5" r="1.2" fill="white" />
              </svg>
              <span className="text-sm font-bold leading-none text-white">
                {progress.streak}
              </span>
              <span className="text-[11px] font-medium text-emerald-100/80">
                hari
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Calendar */}
        <div className="mt-4 px-4">
          <WeeklyCalendarStrip days={weekDays} />
        </div>

        {/* Prayer Card */}
        <div className="mt-4 px-4">
          <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#022c22_0%,#064e3b_50%,#065f46_100%)] p-5 shadow-xl shadow-emerald-950/30">
            {/* Decorative rings */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full border-[14px] border-white/5" />
            <div className="pointer-events-none absolute -right-4 top-6 h-28 w-28 rounded-full border-[10px] border-white/10" />
            <div className="pointer-events-none absolute right-10 top-16 h-10 w-10 rounded-full border-[4px] border-emerald-400/20" />

            <div className="relative z-10 mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 backdrop-blur-sm">
                <MapPin className="h-3.5 w-3.5 text-white/80" />
                <p className="text-[11px] font-semibold text-white/90">
                  {prayerLocationLabel}
                </p>
              </div>
              {!showLocationModal && (
                <Link
                  href="/settings"
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75"
                >
                  Ubah
                </Link>
              )}
            </div>

            {!prayerLocation.province || !prayerLocation.city ? (
              <div className="relative z-10 mb-4 rounded-2xl border border-white/15 bg-black/20 px-4 py-3 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white">
                  Lokasi sholat belum diatur.
                </p>
                <p className="mt-1 text-xs leading-5 text-white/75">
                  Pilih provinsi dan kota dulu supaya jam sholat di home sesuai lokasi kamu.
                </p>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-xs font-semibold text-black"
                >
                  Isi lokasi sekarang
                </button>
              </div>
            ) : null}

            {/* 5 Prayer pills */}
            <div className="relative z-10 mb-5 flex gap-1.5">
              {displayPrayerSchedule.map((prayer) => {
                const isNext = prayer.label === prayerState.nextPrayerName;
                return (
                  <div
                    key={prayer.label}
                    className={`flex-1 rounded-xl py-2 text-center transition-all ${
                      isNext
                        ? "bg-white/20 ring-1 ring-white/30 backdrop-blur-sm"
                        : "bg-white/7"
                    }`}
                  >
                    <p
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        isNext ? "text-white" : "text-emerald-400/70"
                      }`}
                    >
                      {prayer.label}
                    </p>
                    <p
                      className={`mt-0.5 text-[11px] font-semibold ${
                        isNext ? "text-white" : "text-emerald-400/50"
                      }`}
                    >
                      {prayerLoading ? "..." : prayer.time}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Main prayer info */}
            <div className="relative z-10 flex items-end justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5 text-emerald-400" />
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
                    Salat Berikutnya
                  </p>
                </div>
                <p className="text-[2rem] font-bold tracking-tight leading-none text-white">
                  {prayerLoading ? "Memuat" : prayerState.nextPrayerName}
                </p>
                <p className="mt-1.5 text-sm text-emerald-300/80">
                  {prayerError ?? prayerState.countdown}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[2.6rem] font-bold tracking-tight leading-none text-white">
                  {prayerLoading ? "--:--" : prayerState.nextPrayerTime}
                </p>
                <p className="mt-1 text-[11px] text-emerald-300/80">
                  Sekarang {prayerState.currentTime}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="mt-5 px-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
            Menu Utama
          </p>
          <div className="grid grid-cols-2 gap-3">
            {shortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative overflow-hidden rounded-[26px] bg-gradient-to-br ${item.gradient} p-5 shadow-lg ${item.shadow} transition-transform active:scale-[0.97]`}
                >
                  {/* Card decoration */}
                  <div className="pointer-events-none absolute -bottom-5 -right-5 h-28 w-28 rounded-full bg-white/8" />
                  <div className="pointer-events-none absolute bottom-6 right-3 h-8 w-8 rounded-full bg-white/5" />

                  <div className="relative z-10">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/18 backdrop-blur-sm">
                      <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                    </div>
                    <p className="mt-[18px] text-[15px] font-bold tracking-tight leading-tight text-white">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-[12px] text-white/65">
                      {item.caption}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Progress Today */}
        <div className="mt-5 px-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
            Progress Hari Ini
          </p>
          <div className="rounded-[28px] border border-emerald-100/80 bg-white p-5 shadow-sm shadow-emerald-950/5">
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[2.4rem] font-bold tracking-tight leading-none text-gray-950">
                  {progress.ayatRead}
                  <span className="ml-1.5 text-base font-semibold text-gray-300">
                    ayat
                  </span>
                </p>
                <p className="mt-1.5 text-[13px] text-gray-400">
                  dari target{" "}
                  <span className="font-semibold text-gray-600">
                    {progress.ayatGoal}
                  </span>{" "}
                  ayat
                </p>
              </div>
              <div className="shrink-0 rounded-2xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60">
                  Selesai
                </p>
                <p className="mt-0.5 text-2xl font-bold leading-tight text-emerald-700">
                  {ayatProgress}%
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-700"
                style={{ width: `${ayatProgress}%` }}
              />
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 divide-x divide-gray-100">
              <div className="pr-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Surah
                </p>
                <p className="mt-1 text-[1.4rem] font-bold leading-none text-gray-900">
                  {progress.surahRead}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  /{progress.surahGoal}
                </p>
              </div>
              <div className="px-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Halaman
                </p>
                <p className="mt-1 text-[1.4rem] font-bold leading-none text-gray-900">
                  {progress.halamanRead}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  /{progress.halamanGoal}
                </p>
              </div>
              <div className="pl-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Menit
                </p>
                <p className="mt-1 text-[1.4rem] font-bold leading-none text-gray-900">
                  {progress.menitRead}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  /{progress.menitGoal}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Reading */}
        <div className="mt-4 mb-2 px-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
            Lanjut Baca
          </p>
          <div className="overflow-hidden rounded-[28px] border border-emerald-100/80 bg-white shadow-sm shadow-emerald-950/5">
            {/* Progress strip at top */}
            <div className="h-1 w-full bg-gray-100">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                style={{ width: `${continueProgress}%` }}
              />
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xl font-bold tracking-tight text-gray-950">
                    {continueRead?.name ?? "Mulai bacaan pertama"}
                  </p>
                  <p className="mt-1 text-[13px] text-gray-400">
                    {continueRead
                      ? `Ayat ${continueRead.lastAyatRead} dari ${continueRead.ayatCount} · ${continueRead.time}`
                      : "Belum ada riwayat bacaan tersimpan."}
                  </p>
                </div>
                {continueRead && (
                  <div className="shrink-0 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-center">
                    <p className="text-lg font-bold leading-none text-emerald-700">
                      {continueProgress}%
                    </p>
                  </div>
                )}
              </div>

              <Link
                href={continueRead ? `/quran/${continueRead.id}` : "/quran"}
                className="mt-4 flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-600 text-sm font-semibold text-white shadow-md shadow-emerald-900/20 transition-transform active:scale-[0.98]"
              >
                {continueRead ? "Lanjutkan Membaca" : "Mulai Baca Sekarang"}
                <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showLocationModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 pt-10 backdrop-blur-sm">
          <div className="w-full max-w-[390px] rounded-t-[28px] bg-white p-5 shadow-2xl shadow-black/25">
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-gray-200" />
            <div className="mb-4">
              <h2 className="text-lg font-bold tracking-tight text-gray-950">
                Atur lokasi jadwal sholat
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                Kamu belum menentukan lokasi. Pilih provinsi dan kota dulu agar jam sholat di home otomatis sesuai lokasi kamu.
              </p>
            </div>

            <PrayerLocationForm
              province={prayerLocation.province}
              city={prayerLocation.city}
              provinces={provinces}
              cities={cities}
              provinceLoading={provinceLoading}
              cityLoading={cityLoading}
              saving={savingLocation}
              errorMessage={locationError}
              helperText="Kamu tetap bisa mengubah lokasi ini kapan saja dari halaman Settings."
              submitLabel="Simpan & tampilkan jadwal"
              onProvinceChange={handleProvinceChange}
              onCityChange={handleCityChange}
              onSubmit={savePrayerLocation}
            />
          </div>
        </div>
      )}
    </>
  );
}
