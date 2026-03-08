"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export default function AIChatPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 bg-white">
        <Link href="/" className="w-9 h-9 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="font-bold text-sm">Asisten Quran AI</span>
        <div className="w-9 h-9" />
      </div>

      <div className="flex-1 px-6 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold">AI Guide Segera Hadir</h1>
        <p className="text-sm text-text-secondary mt-2 max-w-[260px]">
          Halaman ini sengaja dikosongkan dulu. Nanti AI akan dipakai khusus untuk tanya jawab.
        </p>
      </div>
    </div>
  );
}
