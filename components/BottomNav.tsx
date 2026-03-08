"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, BarChart3, Settings, Plus } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/quran", label: "Quran", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-50">
      {/* FAB Button */}
      <div className="absolute -top-7 right-5">
        <Link
          href="/ai-chat"
          className="w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg"
        >
          <Plus className="w-6 h-6 text-white" />
        </Link>
      </div>

      {/* Nav Bar */}
      <div className="bg-white border-t border-gray-100 px-2 pb-2 pt-2 flex justify-around items-center">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 py-1 px-3"
            >
              <Icon
                className={`w-6 h-6 ${
                  isActive ? "text-black" : "text-gray-400"
                }`}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span
                className={`text-[10px] ${
                  isActive ? "text-black font-bold" : "text-gray-400"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
