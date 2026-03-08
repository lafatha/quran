"use client";

import { weekDays } from "@/lib/mock-data";

export default function WeeklyCalendarStrip() {
  return (
    <div className="flex justify-between px-2 py-3">
      {weekDays.map((d) => (
        <div key={d.day + d.date} className="flex flex-col items-center gap-1.5">
          <span className="text-xs text-text-secondary font-medium">{d.day}</span>
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
              ${d.status === "completed"
                ? "bg-done-green text-white"
                : d.status === "today"
                ? "border-2 border-black text-black bg-white"
                : "text-gray-400"
              }
            `}
          >
            {d.date}
          </div>
        </div>
      ))}
    </div>
  );
}
