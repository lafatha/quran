"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Settings, Sparkles } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/quran", label: "Quran", icon: BookOpen },
  { href: "/ai-chat", label: "AI Guide", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  const renderTab = (tab: (typeof tabs)[number]) => {
    const isActive =
      tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
    const Icon = tab.icon;

    return (
      <Link
        key={tab.href}
        href={tab.href}
        prefetch
        aria-label={tab.label}
        className="group flex items-center justify-center px-2 flex-1"
      >
        <Icon
          className={`w-[22px] h-[22px] transition-colors ${
            isActive ? "text-black" : "text-gray-400 group-hover:text-black"
          } ${isActive ? "scale-110" : "group-hover:scale-110"}`}
          strokeWidth={isActive ? 2.5 : 2}
        />
      </Link>
    );
  };

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-50">
      <div className="bg-white border-t border-gray-100 flex items-center justify-evenly px-2 py-6 pb-safe shadow-[0_-8px_20px_-15px_rgba(0,0,0,0.1)]">
        {tabs.map(renderTab)}
      </div>
    </div>
  );
}
