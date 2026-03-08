"use client";

import { motion } from "framer-motion";
import { ChevronRight, Moon, Bell, Globe, BookOpen, Shield, FileText } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { userProfile } from "@/lib/mock-data";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`w-11 h-6 rounded-full relative transition-colors ${
        on ? "bg-done-green" : "bg-gray-300"
      }`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${
          on ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <motion.h1
        initial="hidden"
        animate="visible"
        custom={0}
        variants={fadeUp}
        className="text-2xl font-bold px-5 pt-6 pb-4"
      >
        Settings
      </motion.h1>

      {/* Profile */}
      <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="px-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">{userProfile.initials}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm">{userProfile.name}</h3>
            <p className="text-xs text-text-secondary">{userProfile.email}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-text-secondary" />
        </div>
      </motion.div>

      {/* Goal Settings */}
      <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp} className="px-4 mt-4">
        <h3 className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2 px-1">
          Target & Pengingat
        </h3>
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-text-secondary" />
              <span className="text-sm font-medium">Target Harian</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">5 halaman</span>
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            </div>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-text-secondary" />
              <span className="text-sm font-medium">Pengingat Sholat</span>
            </div>
            <Toggle defaultOn={true} />
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-text-secondary" />
              <span className="text-sm font-medium">Notifikasi Bacaan</span>
            </div>
            <Toggle defaultOn={false} />
          </div>
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp} className="px-4 mt-4">
        <h3 className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2 px-1">
          Tampilan
        </h3>
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-text-secondary" />
              <span className="text-sm font-medium">Mode Gelap</span>
            </div>
            <Toggle />
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-text-secondary" />
              <span className="text-sm font-medium">Bahasa</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">Indonesia</span>
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* About */}
      <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp} className="px-4 mt-4">
        <h3 className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2 px-1">
          Tentang
        </h3>
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

      <BottomNav />
    </div>
  );
}
