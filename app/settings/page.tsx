"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Moon, Bell, Globe, BookOpen, Shield, FileText, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface SettingsData {
  prayerReminder: boolean;
  readingNotification: boolean;
  darkMode: boolean;
  language: string;
  dailyTargetPages: number;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

interface ToggleProps {
  on: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({ on, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full relative transition-colors ${on ? "bg-done-green" : "bg-gray-300"}`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${on ? "translate-x-[22px]" : "translate-x-0.5"}`}
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
  const [settings, setSettings] = useState<SettingsData>({
    prayerReminder: true,
    readingNotification: false,
    darkMode: false,
    language: "id",
    dailyTargetPages: 5,
  });

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) {
        return;
      }

      setUserId(user.id);

      const [profileResult, settingsResult] = await Promise.all([
        supabase.from("profiles").select("name, email, initials").eq("id", user.id).maybeSingle(),
        supabase
          .from("user_settings")
          .select("prayer_reminder, reading_notification, dark_mode, language, daily_target_pages")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      if (profileResult.data) {
        setName(profileResult.data.name);
        setEmail(profileResult.data.email);
        setInitials(profileResult.data.initials);
      }

      if (settingsResult.data) {
        setSettings({
          prayerReminder: settingsResult.data.prayer_reminder,
          readingNotification: settingsResult.data.reading_notification,
          darkMode: settingsResult.data.dark_mode,
          language: settingsResult.data.language,
          dailyTargetPages: settingsResult.data.daily_target_pages,
        });
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

    const supabase = createClient();
    await supabase
      .from("user_settings")
      .update({
        prayer_reminder: next.prayerReminder,
        reading_notification: next.readingNotification,
        dark_mode: next.darkMode,
        language: next.language,
        daily_target_pages: next.dailyTargetPages,
      })
      .eq("id", userId);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <motion.h1 initial="hidden" animate="visible" custom={0} variants={fadeUp} className="text-2xl font-bold px-5 pt-6 pb-4">
        Settings
      </motion.h1>

      <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="px-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">{initials}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm">{name}</h3>
            <p className="text-xs text-text-secondary">{email}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-text-secondary" />
        </div>
      </motion.div>

      <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp} className="px-4 mt-4">
        <h3 className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2 px-1">Target & Pengingat</h3>
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-text-secondary" />
              <span className="text-sm font-medium">Target Harian</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={settings.dailyTargetPages}
                onChange={(event) => updateSetting({ dailyTargetPages: Number(event.target.value) })}
                className="w-14 h-8 rounded-lg border border-gray-200 text-center text-sm font-bold"
              />
              <span className="text-sm">halaman</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-text-secondary" />
              <span className="text-sm font-medium">Pengingat Sholat</span>
            </div>
            <Toggle on={settings.prayerReminder} onChange={(value) => updateSetting({ prayerReminder: value })} />
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-text-secondary" />
              <span className="text-sm font-medium">Notifikasi Bacaan</span>
            </div>
            <Toggle on={settings.readingNotification} onChange={(value) => updateSetting({ readingNotification: value })} />
          </div>
        </div>
      </motion.div>

      <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp} className="px-4 mt-4">
        <h3 className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2 px-1">Tampilan</h3>
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-text-secondary" />
              <span className="text-sm font-medium">Mode Gelap</span>
            </div>
            <Toggle on={settings.darkMode} onChange={(value) => updateSetting({ darkMode: value })} />
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-text-secondary" />
              <span className="text-sm font-medium">Bahasa</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateSetting({ language: settings.language === "id" ? "en" : "id" })}
                className="text-sm font-bold"
              >
                {settings.language === "id" ? "Indonesia" : "English"}
              </button>
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp} className="px-4 mt-4">
        <h3 className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2 px-1">Tentang</h3>
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
          <div className="flex items-center justify-between p-4">
            <span className="text-sm font-medium">Versi</span>
            <span className="text-sm text-text-secondary">1.0.0</span>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-text-secondary" />
              <span className="text-sm font-medium">Kebijakan Privasi</span>
            </div>
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-text-secondary" />
              <span className="text-sm font-medium">Syarat & Ketentuan</span>
            </div>
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </div>
        </div>
      </motion.div>

      <motion.div initial="hidden" animate="visible" custom={5} variants={fadeUp} className="px-4 mt-4">
        <button
          onClick={signOut}
          className="w-full bg-white rounded-2xl shadow-sm py-3.5 text-sm font-semibold flex items-center justify-center gap-2 border border-gray-100"
        >
          <LogOut className="w-4 h-4" /> Keluar
        </button>
      </motion.div>

    </div>
  );
}
