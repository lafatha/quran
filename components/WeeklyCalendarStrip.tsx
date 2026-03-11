"use client";

import type { WeekDayItem } from "@/lib/types";

interface WeeklyCalendarStripProps {
  days: WeekDayItem[];
}

export default function WeeklyCalendarStrip({ days }: WeeklyCalendarStripProps) {
  return (
    <div className="flex justify-between items-center px-4 py-4 bg-transparent w-full">
      {days.map((d) => {
        const isToday = d.status === "today";
        const progress = d.progress || 0;
        const radius = 18; // Increased radius
        const strokeWidth = 2;
        const normalizedRadius = radius - strokeWidth * 0.5;
        const circumference = normalizedRadius * 2 * Math.PI;
        const strokeDashoffset = circumference - (progress / 100) * circumference;

        return (
          <div
            key={d.day + d.date}
            className="flex flex-col items-center justify-center gap-2"
          >
            <div className="relative w-9 h-9 flex items-center justify-center">
              {/* SVG Container */}
              <svg
                height={radius * 2}
                width={radius * 2}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90"
              >
                {/* Background Circle */}
                <circle
                  stroke={isToday ? "#000000" : "#E5E7EB"}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                  className="transition-colors duration-300"
                />
                {/* Progress Circle */}
                {progress > 0 && (
                  <circle
                    stroke="#22C55E"
                    strokeWidth={strokeWidth + 1}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="transition-all duration-500 ease-out"
                  />
                )}
              </svg>
              
              <span className={`text-xs font-medium z-10 ${isToday ? "text-black font-bold" : "text-gray-500"}`}>
                {d.day}
              </span>
            </div>
            
            <span
              className={`text-sm ${
                isToday ? "text-black font-bold" : "text-gray-500 font-medium"
              }`}
            >
              {d.date}
            </span>
          </div>
        );
      })}
    </div>
  );
}
