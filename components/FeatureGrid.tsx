"use client";

import { BookOpen, CalendarCheck, CircleDot, Sparkles } from "lucide-react";
import Link from "next/link";

const features = [
  {
    label: "Quran",
    icon: BookOpen,
    href: "/quran",
  },
  {
    label: "AI",
    icon: Sparkles,
    href: "/ai-chat",
  },
  {
    label: "Dua",
    icon: CircleDot,
    href: "/doa",
  },
  {
    label: "Prayer Tracker",
    icon: CalendarCheck,
    href: "/tracker",
  },
];

export default function FeatureGrid() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {features.map((feature) => (
        <Link
          key={feature.label}
          href={feature.href}
          className="flex flex-col items-center justify-center gap-1.5 group bg-white rounded-2xl p-2.5 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors aspect-square"
        >
          <feature.icon className="w-5 h-5 text-gray-800" strokeWidth={2} />
          <span className="text-[10px] font-medium text-center leading-tight text-gray-900">
            {feature.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
