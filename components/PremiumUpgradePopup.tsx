"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, X, Sparkles, Infinity, Loader2 } from "lucide-react";

interface PremiumUpgradePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => Promise<void>;
}

export default function PremiumUpgradePopup({
  isOpen,
  onClose,
  onUpgrade,
}: PremiumUpgradePopupProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      await onUpgrade();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="premium-popup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
        >
          <motion.div
            key="premium-popup-card"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-[340px] rounded-3xl bg-white shadow-2xl overflow-hidden"
          >
            {/* Header gradient */}
            <div className="relative bg-gradient-to-br from-emerald-700 to-teal-600 px-6 pt-8 pb-6 text-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <div className="mx-auto mb-4 w-16 h-16 rounded-[22px] bg-white/15 flex items-center justify-center backdrop-blur-sm ring-1 ring-white/20 shadow-lg shadow-black/20">
                <Crown className="w-8 h-8 text-amber-300" />
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight">
                Upgrade ke Premium
              </h2>
              <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
                Kredit harian AI kamu sudah habis.
                <br />
                Upgrade untuk akses tanpa batas!
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Benefits */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Infinity className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm text-gray-700">Prompting AI tanpa batas</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm text-gray-700">Akses penuh ke Mufassir AI</span>
                </div>
              </div>

              {/* Price */}
              <div className="bg-emerald-50 rounded-2xl px-4 py-3 text-center">
                <span className="text-2xl font-bold text-emerald-800">Rp 20.000</span>
                <span className="text-sm text-emerald-600 ml-1">sekali bayar</span>
              </div>

              {/* Upgrade button */}
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-600 text-white text-sm font-semibold shadow-md shadow-emerald-900/25 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Crown className="w-4 h-4" />
                )}
                {loading ? "Memproses…" : "Upgrade Sekarang"}
              </button>

              {/* Dismiss */}
              <button
                onClick={onClose}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
              >
                Nanti saja
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
