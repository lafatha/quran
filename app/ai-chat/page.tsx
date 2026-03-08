"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Info, Mic, Send, BookOpen } from "lucide-react";
import Link from "next/link";
import { chatMessages, quickPrompts } from "@/lib/mock-data";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" as const },
  }),
};

export default function AIChatPage() {
  const [input, setInput] = useState("");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 bg-white">
        <Link href="/" className="w-9 h-9 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="font-bold text-sm">Asisten Quran AI</span>
        <button className="w-9 h-9 flex items-center justify-center">
          <Info className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-4 py-3 overflow-x-auto hide-scrollbar">
        <div className="flex gap-2 w-max">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              className="border border-gray-300 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap hover:bg-gray-50 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {chatMessages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial="hidden"
            animate="visible"
            custom={i}
            variants={fadeUp}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "ai" && (
              <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <BookOpen className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-black text-white rounded-tl-2xl rounded-b-2xl"
                  : "bg-white shadow-sm rounded-tr-2xl rounded-b-2xl"
              }`}
            >
              {msg.text.split("\n").map((line, j) => (
                <p key={j} className={j > 0 ? "mt-2" : ""}>
                  {line.startsWith("**") ? (
                    <strong>{line.replace(/\*\*/g, "")}</strong>
                  ) : (
                    line
                  )}
                </p>
              ))}
              {msg.role === "ai" && "reference" in msg && msg.reference && (
                <button className="mt-2 bg-gray-100 rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1">
                  📖 {msg.reference}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input Bar */}
      <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
          <Mic className="w-5 h-5 text-text-secondary flex-shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya tentang Al-Quran..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-secondary"
          />
          <button className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
