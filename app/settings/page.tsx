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
  MapPin,
  Moon,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";
import PrayerLocationForm from "@/components/PrayerLocationForm";
import { createClient } from "@/lib/supabase/client";

interface SettingsData {
  prayerReminder: boolean;
  readingNotification: boolean;
  darkMode: boolean;
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
  darkMode: false,
  language: "id",
  dailyTargetPages: 5,
  prayerProvince: "",
  prayerCity: "",
};

function Toggle({ on, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-done-green" : "bg-gray-300"}`}
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

  async function persistSettings(next: SettingsData) {
    if (!userId) {
      return;
    }

    const supabase = createClient();
    await supabase.from("user_settings").upsert({
      id: userId,
      prayer_reminder: next.prayerReminder,
      reading_notification: next.readingNotification,
      dark_mode: next.darkMode,
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
      if (!user) {
        return;
      }

      setUserId(user.id);

      const [profileResult, settingsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("name, email, initials")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("user_settings")
          .select(
            "prayer_reminder, reading_notification, dark_mode, language, daily_target_pages, prayer_province, prayer_city",
          )
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      if (profileResult.data) {
        setName(profileResult.data.name);
        setEmail(profileResult.data.email);
        setInitials(profileResult.data.initials);
      }

      if (settingsResult.data) {
        const nextSettings = {
          prayerReminder: settingsResult.data.prayer_reminder,
          readingNotification: settingsResult.data.reading_notification,
          darkMode: settingsResult.data.dark_mode,
          language: settingsResult.data.language,
          dailyTargetPages: settingsResult.data.daily_target_pages,
          prayerProvince: settingsResult.data.prayer_province ?? "",
          prayerCity: settingsResult.data.prayer_city ?? "",
        };

        setSettings(nextSettings);

        if (nextSettings.prayerProvince) {
          const nextCities = await fetchCities(nextSettings.prayerProvince);

          if (!nextCities.includes(nextSettings.prayerCity)) {
            setSettings((prev) => ({
              ...prev,
              prayerCity: "",
            }));
          }
        }
      }
    });
  }, []);

  async function updateSetting(values: Partial<SettingsData>) {
    if (!userId) {
      return;
    }

    const next = {
      ...settings,
      ...values,
    };

    setSettings(next);
    await persistSettings(next);
  }

  async function savePrayerLocation() {
    if (!userId || !settings.prayerProvince || !settings.prayerCity) {
      return;
    }

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
    setSettings((prev) => ({
      ...prev,
      prayerProvince: value,
      prayerCity: "",
    }));

    await fetchCities(value);
  }

  function handleCityChange(value: string) {
    setLocationMessage(null);
    setLocationError(null);
    setSettings((prev) => ({
      ...prev,
      prayerCity: value,
    }));
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
      className="min-h-screen bg-background pb-24"
    >
      <h1 className="px-5 pt-6 pb-4 text-2xl font-bold">
        Settings
      </h1>

      <div className="px-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black">
            <span className="text-lg font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold">{name}</h3>
            <p className="text-xs text-text-secondary">{email}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-text-secondary" />
        </div>
      </div>

      <div className="mt-4 px-4">
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Lokasi Sholat
        </h3>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-950">
                Kota untuk jadwal sholat
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                Jadwal di beranda akan otomatis mengikuti provinsi dan kota yang kamu pilih di sini.
              </p>
            </div>
          </div>

          <PrayerLocationForm
            province={settings.prayerProvince}
            city={settings.prayerCity}
            provinces={provinces}
            cities={cities}
            provinceLoading={provinceLoading}
            cityLoading={cityLoading}
            saving={savingLocation}
            errorMessage={locationError}
            helperText="Gunakan nama kota atau kabupaten persis seperti data EQuran agar jadwal harian tampil akurat."
            submitLabel="Simpan lokasi"
            onProvinceChange={handleProvinceChange}
            onCityChange={handleCityChange}
            onSubmit={savePrayerLocation}
          />

          {locationMessage && (
            <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              {locationMessage}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 px-4">
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Target & Pengingat
        </h3>
        <div className="divide-y divide-gray-100 rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-text-secondary" />
              <span className="text-sm font-medium">Target Harian</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={settings.dailyTargetPages}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  updateSetting({
                    dailyTargetPages: Number.isNaN(value) || value < 1 ? 1 : value,
                  });
                }}
                className="h-8 w-14 rounded-lg border border-gray-200 text-center text-sm font-bold"
              />
              <span className="text-sm">halaman</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-text-secondary" />
              <span className="text-sm font-medium">Pengingat Sholat</span>
            </div>
            <Toggle
              on={settings.prayerReminder}
              onChange={(value) => updateSetting({ prayerReminder: value })}
            />
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-text-secondary" />
              <span className="text-sm font-medium">Notifikasi Bacaan</span>
            </div>
            <Toggle
              on={settings.readingNotification}
              onChange={(value) => updateSetting({ readingNotification: value })}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 px-4">
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Tampilan
        </h3>
        <div className="divide-y divide-gray-100 rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-text-secondary" />
              <span className="text-sm font-medium">Mode Gelap</span>
            </div>
            <Toggle
              on={settings.darkMode}
              onChange={(value) => updateSetting({ darkMode: value })}
            />
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-text-secondary" />
              <span className="text-sm font-medium">Bahasa</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  updateSetting({
                    language: settings.language === "id" ? "en" : "id",
                  })
                }
                className="text-sm font-bold"
              >
                {settings.language === "id" ? "Indonesia" : "English"}
              </button>
              <ChevronRight className="h-4 w-4 text-text-secondary" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 px-4">
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Tentang
        </h3>
        <div className="divide-y divide-gray-100 rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <span className="text-sm font-medium">Versi</span>
            <span className="text-sm text-text-secondary">1.0.0</span>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-text-secondary" />
              <span className="text-sm font-medium">Kebijakan Privasi</span>
            </div>
            <ChevronRight className="h-4 w-4 text-text-secondary" />
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-text-secondary" />
              <span className="text-sm font-medium">Syarat & Ketentuan</span>
            </div>
            <ChevronRight className="h-4 w-4 text-text-secondary" />
          </div>
        </div>
      </div>

      <div className="mt-4 px-4">
        <button
          onClick={signOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white py-3.5 text-sm font-semibold shadow-sm"
        >
          <LogOut className="h-4 w-4" /> Keluar
        </button>
      </div>
    </motion.div>
  );
}
