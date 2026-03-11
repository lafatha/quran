"use client";

import { BookOpen, Compass, CircleDot, CalendarCheck } from "lucide-react";
import Link from "next/link";

const features = [
  {
    label: "Quran",
    icon: BookOpen,
    href: "/quran",
    color: "bg-deen-main",
  },
  {
    label: "Qibla",
    icon: Compass,
    href: "/qibla", // Placeholder route
    color: "bg-deen-main",
  },
  {
    label: "Dhikr",
    icon: CircleDot,
    href: "/dhikr", // Placeholder route
    color: "bg-deen-main",
  },
  {
    label: "Prayer Tracker",
    icon: CalendarCheck,
    href: "/tracker", // Placeholder route
    color: "bg-deen-main",
  },
];

export default function FeatureGrid() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {features.map((feature) => (
        <Link
          key={feature.label}
          href={feature.href}
          className="flex flex-col items-center justify-center gap-1.5 group bg-white rounded-2xl p-2.5 shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors aspect-square"
        >
          <feature.icon className="w-5 h-5 text-deen-main" strokeWidth={2} />
          <span className="text-[10px] font-medium text-center leading-tight text-black">
            {feature.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
