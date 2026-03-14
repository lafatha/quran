"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Crown } from "lucide-react";

interface CreditBannerProps {
  visible: boolean;
  onUpgradeClick: () => void;
}

export default function CreditBanner({ visible, onUpgradeClick }: CreditBannerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="credit-banner"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25 }}
          className="mx-4 mb-2"
        >
          <button
            onClick={onUpgradeClick}
            className="flex items-center gap-2.5 w-full rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 px-4 py-3 text-left transition-all hover:shadow-sm active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Crown className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-800 leading-tight">
                Kredit AI habis untuk hari ini
              </p>
              <p className="text-[11px] text-amber-600/80 mt-0.5">
                Upgrade ke Premium — Rp 20.000 saja
              </p>
            </div>
            <span className="text-xs font-bold text-amber-700 flex-shrink-0">
              Upgrade
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
