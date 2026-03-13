"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  BookOpen,
  ChevronRight,
  FileText,
  Globe,
  LogOut,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";
import PrayerLocationForm from "@/components/PrayerLocationForm";
import { createClient } from "@/lib/supabase/client";

interface SettingsData {
  prayerReminder: boolean;
  readingNotification: boolean;
  language: string;
  dailyTargetPages: number;
  prayerProvince: string;
  prayerCity: string;
}

interface ToggleProps {
  on: boolean;
  onChange: (value: boolean) => void;
}

interface ProvinceResponse {
  data?: string[];
  error?: string;
}

interface CityResponse {
  data?: string[];
  error?: string;
}

const defaultSettings: SettingsData = {
  prayerReminder: true,
  readingNotification: false,
  language: "id",
  dailyTargetPages: 5,
  prayerProvince: "",
  prayerCity: "",
};

function Toggle({ on, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-gray-950" : "bg-gray-200"}`}
    >
      <div
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("-");
  const [email, setEmail] = useState("-");
  const [initials, setInitials] = useState("Q");
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [provinceLoading, setProvinceLoading] = useState(true);
  const [cityLoading, setCityLoading] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

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
        headers: { "Content-Type": "application/json" },
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

  async function persistSettings(next: SettingsData) {
    if (!userId) return;
    const supabase = createClient();
    await supabase.from("user_settings").upsert({
      id: userId,
      prayer_reminder: next.prayerReminder,
      reading_notification: next.readingNotification,
      language: next.language,
      daily_target_pages: next.dailyTargetPages,
      prayer_province: next.prayerProvince || null,
      prayer_city: next.prayerCity || null,
    });
  }

  useEffect(() => {
    const supabase = createClient();
    fetchProvinces();

    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;

      setUserId(user.id);

      const [profileResult, settingsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("name, email, initials")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("user_settings")
          .select("prayer_reminder, reading_notification, language, daily_target_pages, prayer_province, prayer_city")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      if (profileResult.data) {
        setName(profileResult.data.name);
        setEmail(profileResult.data.email);
        setInitials(profileResult.data.initials);
      }

      if (settingsResult.data) {
        const nextSettings: SettingsData = {
          prayerReminder: settingsResult.data.prayer_reminder,
          readingNotification: settingsResult.data.reading_notification,
          language: settingsResult.data.language,
          dailyTargetPages: settingsResult.data.daily_target_pages,
          prayerProvince: settingsResult.data.prayer_province ?? "",
          prayerCity: settingsResult.data.prayer_city ?? "",
        };
        setSettings(nextSettings);

        if (nextSettings.prayerProvince) {
          const nextCities = await fetchCities(nextSettings.prayerProvince);
          if (!nextCities.includes(nextSettings.prayerCity)) {
            setSettings((prev) => ({ ...prev, prayerCity: "" }));
          }
        }
      }
    });
  }, []);

  async function updateSetting(values: Partial<SettingsData>) {
    if (!userId) return;
    const next = { ...settings, ...values };
    setSettings(next);
    await persistSettings(next);
  }

  async function savePrayerLocation() {
    if (!userId || !settings.prayerProvince || !settings.prayerCity) return;
    setSavingLocation(true);
    setLocationMessage(null);
    try {
      await persistSettings(settings);
      setLocationError(null);
      setLocationMessage("Lokasi jadwal sholat berhasil disimpan.");
    } catch {
      setLocationError("Gagal menyimpan lokasi jadwal sholat.");
    } finally {
      setSavingLocation(false);
    }
  }

  async function handleProvinceChange(value: string) {
    setLocationMessage(null);
    setLocationError(null);
    setSettings((prev) => ({ ...prev, prayerProvince: value, prayerCity: "" }));
    await fetchCities(value);
  }

  function handleCityChange(value: string) {
    setLocationMessage(null);
    setLocationError(null);
    setSettings((prev) => ({ ...prev, prayerCity: value }));
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" as const }}
      className="min-h-screen bg-[linear-gradient(180deg,#eaf5f0_0%,#f4f9f6_30%,#ffffff_100%)] pb-28"
    >
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-[1.9rem] font-bold tracking-tight leading-none text-emerald-950">
          Pengaturan
        </h1>
      </div>

      {/* Profile card */}
      <div className="mt-5 px-4">
        <div className="flex items-center gap-4 rounded-[28px] border border-emerald-100/80 bg-white p-5 shadow-sm shadow-emerald-950/5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-950">
            <span className="text-lg font-bold text-white">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold tracking-tight text-gray-950">{name}</p>
            <p className="mt-0.5 truncate text-[13px] text-gray-400">{email}</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
        </div>
      </div>

      {/* Lokasi Sholat */}
      <div className="mt-5 px-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
          Lokasi Sholat
        </p>
        <div className="rounded-[28px] border border-emerald-100/80 bg-white p-5 shadow-sm shadow-emerald-950/5">
          <p className="text-[15px] font-bold tracking-tight text-gray-950">
            Kota untuk jadwal sholat
          </p>
          <p className="mt-1 text-[13px] leading-5 text-gray-400">
            Jadwal di beranda otomatis mengikuti kota yang kamu pilih di sini.
          </p>
          <div className="mt-4">
            <PrayerLocationForm
              province={settings.prayerProvince}
              city={settings.prayerCity}
              provinces={provinces}
              cities={cities}
              provinceLoading={provinceLoading}
              cityLoading={cityLoading}
              saving={savingLocation}
              errorMessage={locationError}
              helperText="Gunakan nama kota atau kabupaten persis seperti data EQuran agar jadwal tampil akurat."
              submitLabel="Simpan lokasi"
              onProvinceChange={handleProvinceChange}
              onCityChange={handleCityChange}
              onSubmit={savePrayerLocation}
            />
          </div>
          {locationMessage && (
            <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">
              {locationMessage}
            </div>
          )}
        </div>
      </div>

      {/* Target & Pengingat */}
      <div className="mt-5 px-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
          Target & Pengingat
        </p>
        <div className="overflow-hidden rounded-[28px] border border-emerald-100/80 bg-white shadow-sm shadow-emerald-950/5 divide-y divide-gray-100">
          {/* Target harian */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-gray-300" />
              <span className="text-[14px] font-medium text-gray-900">Target Harian</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={settings.dailyTargetPages}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  updateSetting({ dailyTargetPages: Number.isNaN(value) || value < 1 ? 1 : value });
                }}
                className="h-8 w-14 rounded-xl border border-gray-200 text-center text-sm font-bold text-gray-950 outline-none focus:border-gray-400"
              />
              <span className="text-[13px] text-gray-400">halaman</span>
            </div>
          </div>
          {/* Pengingat sholat */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-300" />
              <span className="text-[14px] font-medium text-gray-900">Pengingat Sholat</span>
            </div>
            <Toggle
              on={settings.prayerReminder}
              onChange={(value) => updateSetting({ prayerReminder: value })}
            />
          </div>
          {/* Notifikasi bacaan */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-300" />
              <span className="text-[14px] font-medium text-gray-900">Notifikasi Bacaan</span>
            </div>
            <Toggle
              on={settings.readingNotification}
              onChange={(value) => updateSetting({ readingNotification: value })}
            />
          </div>
        </div>
      </div>

      {/* Bahasa */}
      <div className="mt-5 px-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
          Bahasa
        </p>
        <div className="overflow-hidden rounded-[28px] border border-emerald-100/80 bg-white shadow-sm shadow-emerald-950/5">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-gray-300" />
              <span className="text-[14px] font-medium text-gray-900">Bahasa Aplikasi</span>
            </div>
            <button
              type="button"
              onClick={() => updateSetting({ language: settings.language === "id" ? "en" : "id" })}
              className="flex items-center gap-1.5"
            >
              <span className="text-[14px] font-semibold text-gray-950">
                {settings.language === "id" ? "Indonesia" : "English"}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Tentang */}
      <div className="mt-5 px-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
          Tentang
        </p>
        <div className="overflow-hidden rounded-[28px] border border-emerald-100/80 bg-white shadow-sm shadow-emerald-950/5 divide-y divide-gray-100">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-[14px] font-medium text-gray-900">Versi</span>
            <span className="text-[13px] text-gray-400">1.0.0</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-300" />
              <span className="text-[14px] font-medium text-gray-900">Kebijakan Privasi</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-300" />
              <span className="text-[14px] font-medium text-gray-900">Syarat & Ketentuan</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </div>
        </div>
      </div>

      {/* Keluar */}
      <div className="mt-5 px-4">
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center justify-center gap-2 rounded-[28px] border border-red-100 bg-white py-4 text-[14px] font-semibold text-red-500 shadow-sm"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </motion.div>
  );
}
