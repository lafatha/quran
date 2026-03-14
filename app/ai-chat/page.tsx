"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  Sparkles,
  Mic,
  ArrowUp,
  Plus,
  X,
  MessageSquare,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { estimateTokens } from "@/lib/chat";
import type { ChatMessage, Conversation, ChatApiRequest } from "@/lib/chat";
import type { Database } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";

// ─── Local DB row types ───────────────────────────────────────────────────────

type ConversationRow =
  Database["public"]["Tables"]["chat_conversations"]["Row"];
type MessageRow = Database["public"]["Tables"]["chat_messages"]["Row"];
type PremiumSubscriptionRow =
  Database["public"]["Tables"]["premium_subscriptions"]["Row"];
type AiPromptUsageRow = Database["public"]["Tables"]["ai_prompt_usage"]["Row"];

function isTemporaryMessage(message: ChatMessage) {
  return message.id.startsWith("tmp-");
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SUGGESTION_PROMPTS = [
  "Apa keutamaan membaca Al-Fatihah?",
  "Jelaskan makna Ayat Kursi",
  "Surah apa yang dianjurkan dibaca setiap hari?",
];

// ─── Sub-components ──────────────────────────────────────────────────────────

interface TypingIndicatorProps {
  visible: boolean;
}

function TypingIndicator({ visible }: TypingIndicatorProps) {
  if (!visible) return null;
  return (
    <div className="flex items-end gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-700 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-900/20">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-emerald-100">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 block"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex items-end gap-2.5 mb-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-700 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-900/20">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div
        className={`max-w-[78%] px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-emerald-700 to-teal-600 text-white rounded-2xl rounded-br-sm shadow-md shadow-emerald-900/20"
            : "bg-white text-gray-900 rounded-2xl rounded-bl-sm shadow-sm border border-emerald-100"
        }`}
      >
        <FormattedMessage content={message.content} isUser={isUser} />
        {isStreaming && (
          <span className="inline-block w-0.5 h-3.5 bg-emerald-300 ml-0.5 align-middle animate-pulse" />
        )}
      </div>
    </motion.div>
  );
}

// ─── FormattedMessage ─────────────────────────────────────────────────────────

interface FormattedMessageProps {
  content: string;
  isUser: boolean;
}

function renderInlineFormatting(
  text: string,
  isUser: boolean,
): React.ReactNode[] {
  const segments = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return segments.map((segment, index) => {
    const isBold =
      segment.startsWith("**") && segment.endsWith("**") && segment.length > 4;
    const isItalic =
      segment.startsWith("*") &&
      segment.endsWith("*") &&
      !isBold &&
      segment.length > 2;

    if (isBold) {
      return (
        <strong
          key={index}
          className={`font-semibold ${isUser ? "text-white" : "text-gray-900"}`}
        >
          {segment.slice(2, -2)}
        </strong>
      );
    }

    if (isItalic) {
      return (
        <em
          key={index}
          className={`italic ${isUser ? "text-white/90" : "text-gray-800"}`}
        >
          {segment.slice(1, -1)}
        </em>
      );
    }

    return <span key={index}>{segment}</span>;
  });
}

function FormattedMessage({ content, isUser }: FormattedMessageProps) {
  const normalizedContent = content.replace(/\r\n/g, "\n");
  const rawLines = normalizedContent.split("\n");

  type LineSegment = { type: "line"; value: string; index: number };
  type TableSegment = { type: "table"; rows: string[]; index: number };
  type Segment = LineSegment | TableSegment;

  const segments: Segment[] = [];
  let si = 0;
  while (si < rawLines.length) {
    const t = rawLines[si].trim();
    if (t.startsWith("|") && t.endsWith("|")) {
      const tableRows: string[] = [];
      const startIdx = si;
      while (
        si < rawLines.length &&
        rawLines[si].trim().startsWith("|") &&
        rawLines[si].trim().endsWith("|")
      ) {
        tableRows.push(rawLines[si].trim());
        si++;
      }
      segments.push({ type: "table", rows: tableRows, index: startIdx });
    } else {
      segments.push({ type: "line", value: rawLines[si], index: si });
      si++;
    }
  }

  function parseTableRow(row: string): string[] {
    return row
      .split("|")
      .map((cell) => cell.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
  }

  function renderTableSegment(rows: string[], key: number) {
    const dataRows = rows.filter((row) => !/^\|[\s|:\-]+\|$/.test(row));
    if (dataRows.length === 0) return null;
    const [headerRow, ...bodyRows] = dataRows;
    const headers = parseTableRow(headerRow);
    const bodyData = bodyRows.map(parseTableRow);
    return (
      <div
        key={key}
        className="overflow-x-auto w-full my-2 rounded-xl border border-emerald-100"
      >
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr className="bg-emerald-50">
              {headers.map((cell, ci) => (
                <th
                  key={ci}
                  className="border-b border-emerald-100 px-2 py-1.5 font-semibold text-emerald-800 text-left whitespace-nowrap"
                >
                  {renderInlineFormatting(cell, false)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyData.map((row, ri) => (
              <tr
                key={ri}
                className={ri % 2 === 0 ? "bg-white" : "bg-emerald-50/40"}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="border-b border-emerald-50 px-2 py-1.5 text-gray-700 leading-snug"
                  >
                    {renderInlineFormatting(cell, false)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 break-words">
      {segments.map((seg) => {
        if (seg.type === "table") {
          return renderTableSegment(seg.rows, seg.index);
        }

        const { value: line, index } = seg;
        const trimmed = line.trim();

        if (trimmed === "") {
          return <div key={index} className="h-2" />;
        }

        const arabicWithLabelMatch = trimmed.match(/^Arab\s*:?[\s]*(.+)$/i);
        const arabicText = arabicWithLabelMatch
          ? arabicWithLabelMatch[1].trim()
          : trimmed;
        const isArabicLine =
          /^[\u0600-\u06FF\u0750-\u077F]/.test(arabicText) ||
          /^[\u0600-\u06FF\u0750-\u077F]/.test(trimmed);

        if (isArabicLine) {
          return (
            <p
              key={index}
              className={`text-right leading-loose text-lg font-arabic ${isUser ? "text-white" : "text-emerald-900"}`}
              dir="rtl"
            >
              {arabicText}
            </p>
          );
        }

        const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
        if (headingMatch) {
          return (
            <p
              key={index}
              className={`font-semibold mt-2 ${isUser ? "text-white" : "text-emerald-900"}`}
            >
              {renderInlineFormatting(headingMatch[1], isUser)}
            </p>
          );
        }

        if (/^-{3,}$/.test(trimmed)) {
          return (
            <div
              key={index}
              className={`h-px my-2 ${isUser ? "bg-white/30" : "bg-emerald-100"}`}
            />
          );
        }

        const quoteMatch = trimmed.match(/^>\s*(.+)$/);
        if (quoteMatch) {
          return (
            <div
              key={index}
              className={`border-l-2 pl-3 rounded-r-lg py-0.5 ${
                isUser
                  ? "border-white/40 text-white/90"
                  : "border-emerald-400 text-gray-700 bg-emerald-50/60"
              }`}
            >
              {renderInlineFormatting(quoteMatch[1], isUser)}
            </div>
          );
        }

        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (numberedMatch) {
          return (
            <div key={index} className="flex gap-2">
              <span
                className={`flex-shrink-0 w-5 text-right font-semibold ${isUser ? "text-white/80" : "text-emerald-600"}`}
              >
                {numberedMatch[1]}.
              </span>
              <span
                className={`flex-1 leading-relaxed ${isUser ? "text-white" : "text-gray-800"}`}
              >
                {renderInlineFormatting(numberedMatch[2], isUser)}
              </span>
            </div>
          );
        }

        const bulletMatch = trimmed.match(/^(?:[-•*])\s+(.+)$/);
        if (bulletMatch) {
          return (
            <div key={index} className="flex gap-2">
              <span
                className={`flex-shrink-0 ${isUser ? "text-white/80" : "text-emerald-500"}`}
              >
                •
              </span>
              <span
                className={`flex-1 leading-relaxed ${isUser ? "text-white" : "text-gray-800"}`}
              >
                {renderInlineFormatting(bulletMatch[1], isUser)}
              </span>
            </div>
          );
        }

        if (/^[A-Z\s]{4,}$/.test(trimmed) || /^.{3,60}:$/.test(trimmed)) {
          return (
            <p
              key={index}
              className={`font-semibold mt-2 ${isUser ? "text-white" : "text-emerald-900"}`}
            >
              {renderInlineFormatting(trimmed, isUser)}
            </p>
          );
        }

        return (
          <p
            key={index}
            className={`leading-relaxed ${isUser ? "text-white" : "text-gray-800"}`}
          >
            {renderInlineFormatting(trimmed, isUser)}
          </p>
        );
      })}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  onSuggestion: (text: string) => void;
}

function EmptyState({ onSuggestion }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center flex-1 px-6 py-8 text-center"
    >
      {/* Icon */}
      <div className="relative mb-5">
        <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-emerald-700 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-900/25">
          <Sparkles className="w-9 h-9 text-white" />
        </div>
        <div className="absolute -right-1 -bottom-1 w-6 h-6 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
          <span className="text-[9px] font-black text-amber-900">AI</span>
        </div>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-emerald-950">
        Mufassir
      </h1>
      <p className="text-sm text-gray-500 mt-2 max-w-[260px] leading-relaxed">
        Asisten Al-Quran berbasis AI. Tanya apa saja tentang ayat, tafsir, dan
        ibadah.
      </p>

      {/* Suggestion chips */}
      <div className="mt-8 w-full flex flex-col gap-2.5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
          Pertanyaan populer
        </p>
        {SUGGESTION_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSuggestion(prompt)}
            className="flex items-center justify-between w-full bg-white border border-emerald-100 rounded-2xl px-4 py-3.5 text-left text-sm text-gray-700 hover:border-emerald-300 hover:shadow-sm hover:shadow-emerald-900/5 transition-all active:scale-[0.98]"
          >
            <span className="font-medium">{prompt}</span>
            <ChevronRight className="w-4 h-4 text-emerald-400 flex-shrink-0 ml-2" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  isOpen: boolean;
  conversations: Conversation[];
  activeConversationId: string | null;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

function groupConversationsByDate(
  conversations: Conversation[],
): Record<string, Conversation[]> {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  const groups: Record<string, Conversation[]> = {};
  for (const conv of conversations) {
    const d = new Date(conv.updated_at).toDateString();
    const label =
      d === today ? "Hari ini" : d === yesterday ? "Kemarin" : "Lebih lama";
    if (!groups[label]) groups[label] = [];
    groups[label].push(conv);
  }
  return groups;
}

function Sidebar({
  isOpen,
  conversations,
  activeConversationId,
  onClose,
  onSelectConversation,
  onNewChat,
}: SidebarProps) {
  const grouped = groupConversationsByDate(conversations);
  const groupOrder = ["Hari ini", "Kemarin", "Lebih lama"];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="drawer"
          initial={{ x: -32, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -32, opacity: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 z-10 w-[78%] max-w-[300px]"
        >
          <div className="flex h-full flex-col bg-[linear-gradient(180deg,#022c22_0%,#053d2e_50%,#064e3b_100%)]">
            {/* Decorative top accent */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.15),transparent_70%)] pointer-events-none" />

            {/* Drawer header */}
            <div className="relative z-10 flex items-center justify-between px-4 pt-5 pb-4 border-b border-white/8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-bold text-sm text-white leading-none block">
                    Mufassir
                  </span>
                  <span className="text-[10px] text-emerald-400/80 font-medium">
                    AI Guide
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* New Chat button */}
            <div className="relative z-10 px-3 pt-3.5 pb-2">
              <button
                onClick={onNewChat}
                className="flex items-center justify-center gap-2 w-full bg-white text-emerald-900 rounded-2xl px-4 py-2.5 text-sm font-bold hover:bg-emerald-50 transition-colors shadow-lg shadow-black/20 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Chat Baru</span>
              </button>
            </div>

            {/* History */}
            <div className="relative z-10 flex-1 overflow-y-auto px-3 pb-6 hide-scrollbar">
              {conversations.length === 0 ? (
                <div className="mt-10 flex flex-col items-center text-center px-4">
                  <MessageSquare className="w-8 h-8 text-emerald-700/50 mb-3" />
                  <p className="text-xs text-emerald-400/60 leading-relaxed">
                    Belum ada riwayat percakapan
                  </p>
                </div>
              ) : (
                groupOrder.map((label) => {
                  const items = grouped[label];
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={label} className="mt-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-500/60 px-1 mb-2">
                        {label}
                      </p>
                      {items.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => {
                            onSelectConversation(conv.id);
                            onClose();
                          }}
                          className={`flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-left text-sm transition-all mb-0.5 ${
                            conv.id === activeConversationId
                              ? "bg-emerald-500/25 text-white font-semibold ring-1 ring-emerald-400/30"
                              : "text-white/65 hover:bg-white/8 hover:text-white/90"
                          }`}
                        >
                          <MessageSquare
                            className={`w-3.5 h-3.5 flex-shrink-0 ${
                              conv.id === activeConversationId
                                ? "text-emerald-400"
                                : "text-white/30"
                            }`}
                          />
                          <span className="truncate">{conv.title}</span>
                        </button>
                      ))}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom brand footer */}
            <div className="relative z-10 px-4 py-4 border-t border-white/8">
              <p className="text-[10px] text-emerald-600/50 text-center font-medium">
                Mufasir · Mufassir v1
              </p>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ─── InputBar ─────────────────────────────────────────────────────────────────

interface InputBarProps {
  value: string;
  isLoading: boolean;
  onChange: (v: string) => void;
  onSubmit: () => void;
}

function InputBar({ value, isLoading, onChange, onSubmit }: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) onSubmit();
    }
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [value]);

  const hasValue = value.trim().length > 0;

  return (
    <div className="px-4 pb-5 pt-2">
      <div
        className={`flex items-end gap-2 bg-white border rounded-[24px] px-3 py-2 shadow-sm transition-all ${
          hasValue
            ? "border-emerald-300 shadow-emerald-900/8"
            : "border-emerald-100 shadow-emerald-900/5"
        }`}
      >
        {/* Microphone */}
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-full text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex-shrink-0 mb-0.5"
        >
          <Mic className="w-[18px] h-[18px]" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tanya tentang Al-Quran…"
          disabled={isLoading}
          className="flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none py-1.5 leading-5 max-h-24 disabled:opacity-50"
        />

        {/* Send button */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={!hasValue || isLoading}
          className={`w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 mb-0.5 transition-all active:scale-90 ${
            hasValue && !isLoading
              ? "bg-gradient-to-br from-emerald-700 to-teal-600 text-white shadow-md shadow-emerald-900/25"
              : "bg-gray-100 text-gray-300 cursor-not-allowed"
          }`}
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
      <p className="text-center text-[10px] text-gray-400/70 mt-2 font-medium">
        Mufasir · Mufassir dapat membuat kesalahan
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIChatPage() {
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);

  const [isPremium, setIsPremium] = useState(false);
  const [promptCount, setPromptCount] = useState(0);
  const [usageDate, setUsageDate] = useState<string | null>(null);
  const [hasUpgradeDeclinedToday, setHasUpgradeDeclinedToday] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(null);
  const [isCheckingInvoice, setIsCheckingInvoice] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // ── Auth ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const id = data.user?.id ?? null;
      setUserId(id);

      if (!id) return;

      const now = new Date();
      const today = `${now.getFullYear()}-${String(
        now.getMonth() + 1,
      ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      setUsageDate(today);

      const { data: subscription } = await supabase
        .from("premium_subscriptions")
        .select("is_premium")
        .eq("user_id", id)
        .maybeSingle();

      if (subscription) {
        setIsPremium((subscription as PremiumSubscriptionRow).is_premium);
      }

      const { data: usage } = await supabase
        .from("ai_prompt_usage")
        .select("prompt_count, usage_date, upgrade_declined")
        .eq("user_id", id)
        .eq("usage_date", today)
        .maybeSingle();

      if (usage) {
        const row = usage as AiPromptUsageRow;
        setPromptCount(row.prompt_count);
        setHasUpgradeDeclinedToday(row.upgrade_declined);
      } else {
        setPromptCount(0);
        setHasUpgradeDeclinedToday(false);
      }
    });
  }, [supabase.auth, supabase]);

  // ── Fetch sidebar conversation list ───────────────────────────────────────
  const fetchConversations = useCallback(() => {
    if (!userId) return;
    supabase
      .from("chat_conversations")
      .select("id, title, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        if (data) setConversations(data as Conversation[]);
      });
  }, [supabase, userId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  useEffect(() => {
    const behavior: ScrollBehavior = streamingMessageId ? "auto" : "smooth";

    if (scrollFrameRef.current !== null) {
      cancelAnimationFrame(scrollFrameRef.current);
    }

    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollToBottom(behavior);
      scrollFrameRef.current = null;
    });

    return () => {
      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [messages.length, isTyping, streamingMessageId, scrollToBottom]);

  // ── Load messages for a conversation ──────────────────────────────────────
  const loadConversation = useCallback(
    (conversationId: string) => {
      supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .then(({ data }) => {
          if (!data) return;

          const fetchedMessages = data as ChatMessage[];
          setMessages((prev) => {
            const optimisticMessages = prev.filter(isTemporaryMessage);

            if (optimisticMessages.length === 0) {
              return fetchedMessages;
            }

            return [...fetchedMessages, ...optimisticMessages].sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime(),
            );
          });
        });
    },
    [supabase],
  );

  useEffect(() => {
    if (activeConversationId) loadConversation(activeConversationId);
    else setMessages([]);
  }, [activeConversationId, loadConversation]);

  // ── Create conversation row in DB ─────────────────────────────────────────
  const createConversation = useCallback(
    async (firstMessage: string): Promise<string | null> => {
      if (!userId) return null;
      const title =
        firstMessage.length > 40
          ? `${firstMessage.slice(0, 40)}…`
          : firstMessage;
      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({ user_id: userId, title })
        .select("id")
        .single();
      if (error || !data) return null;
      return (data as ConversationRow).id;
    },
    [supabase, userId],
  );

  // ── Persist a message to DB ────────────────────────────────────────────────
  const persistMessage = useCallback(
    async (
      conversationId: string,
      role: "user" | "assistant",
      content: string,
    ): Promise<string | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          role,
          content,
          token_count: estimateTokens(content),
        })
        .select("id, role, content, created_at")
        .single();
      if (error || !data) return null;
      return (data as MessageRow).id;
    },
    [supabase, userId],
  );

  // ── Touch conversation updated_at (sidebar ordering) ─────────────────────
  const touchConversation = useCallback(
    (conversationId: string) => {
      supabase
        .from("chat_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId)
        .then(() => fetchConversations());
    },
    [supabase, fetchConversations],
  );

  // ── Core send logic ───────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      if (!isPremium) {
        if (usageDate === null) {
          return;
        }

        if (promptCount >= 10) {
          if (hasUpgradeDeclinedToday) {
            return;
          }
          setIsUpgradeModalOpen(true);
          return;
        }
      }

      const tempUserMsgId = `tmp-user-${Date.now()}`;
      const tempUserMsg: ChatMessage = {
        id: tempUserMsgId,
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);
      setIsTyping(true);

      let convId = activeConversationId;
      if (!convId) {
        convId = await createConversation(text);
        if (convId) setActiveConversationId(convId);
      }

      if (convId) {
        persistMessage(convId, "user", text).then((realId) => {
          if (realId) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempUserMsgId ? { ...m, id: realId } : m,
              ),
            );
          }
        });

        if (!isPremium && usageDate) {
          const newCount = promptCount + 1;
          setPromptCount(newCount);
          supabase
            .from("ai_prompt_usage")
            .upsert(
              {
                user_id: userId,
                usage_date: usageDate,
                prompt_count: newCount,
                upgrade_declined: hasUpgradeDeclinedToday,
              },
              {
                onConflict: "user_id,usage_date",
              },
            )
            .then(() => undefined);
        }
      }

      const tempAiMsgId = `tmp-ai-${Date.now()}`;
      const tempAiMsg: ChatMessage = {
        id: tempAiMsgId,
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      };

      try {
        const reqBody: ChatApiRequest = {
          query: text,
          conversationId: convId,
          userId,
        };

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody),
        });

        if (!res.ok || !res.body) {
          throw new Error(`API error: ${res.status}`);
        }

        setMessages((prev) => [...prev, tempAiMsg]);
        setStreamingMessageId(tempAiMsgId);
        setIsTyping(false);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        let pendingContent = "";
        let lastFlushAt = 0;

        const flushBufferedContent = (force = false) => {
          const now = Date.now();
          if (!force && now - lastFlushAt < 40) return;
          fullContent = pendingContent;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAiMsgId ? { ...m, content: fullContent } : m,
            ),
          );
          lastFlushAt = now;
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          pendingContent += chunk;
          flushBufferedContent();
        }

        flushBufferedContent(true);
        setStreamingMessageId(null);

        if (convId && fullContent) {
          persistMessage(convId, "assistant", fullContent).then((realId) => {
            if (realId) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === tempAiMsgId ? { ...m, id: realId } : m,
                ),
              );
            }
          });
          touchConversation(convId);
        }
      } catch {
        setStreamingMessageId(null);
        setIsTyping(false);
        const errorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content:
            "Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi.",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempAiMsgId),
          errorMsg,
        ]);
      } finally {
        setIsTyping(false);
        setStreamingMessageId(null);
      }
    },
    [
      isTyping,
      activeConversationId,
      userId,
      createConversation,
      persistMessage,
      touchConversation,
      isPremium,
      promptCount,
      usageDate,
      hasUpgradeDeclinedToday,
      supabase,
    ],
  );

  // ── Handle input bar submit ────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMessage(text);
  }, [input, sendMessage]);

  // ── Handle suggestion chip tap ────────────────────────────────────────────
  const handleSuggestion = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage],
  );

  // ── Start a new chat ──────────────────────────────────────────────────────
  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setInput("");
    setSidebarOpen(false);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────

  const handleUpgradeDecline = useCallback(() => {
    if (!userId || !usageDate) {
      setIsUpgradeModalOpen(false);
      return;
    }
    setHasUpgradeDeclinedToday(true);
    supabase
      .from("ai_prompt_usage")
      .upsert(
        {
          user_id: userId,
          usage_date: usageDate,
          prompt_count,
          upgrade_declined: true,
        },
        {
          onConflict: "user_id,usage_date",
        },
      )
      .then(() => undefined);
    setIsUpgradeModalOpen(false);
  }, [promptCount, supabase, usageDate, userId]);

  const handleCreateInvoice = useCallback(async () => {
    if (isCreatingInvoice) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;
    setIsCreatingInvoice(true);
    try {
      const res = await fetch("/api/billing/mayar/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) {
        setIsCreatingInvoice(false);
        return;
      }
      const data = (await res.json()) as {
        invoiceId: string;
        paymentUrl: string;
      };
      setCurrentInvoiceId(data.invoiceId);
      if (data.paymentUrl) {
        window.open(data.paymentUrl, "_blank");
      }
    } finally {
      setIsCreatingInvoice(false);
    }
  }, [isCreatingInvoice, supabase]);

  useEffect(() => {
    if (!currentInvoiceId || isPremium) return;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      setIsCheckingInvoice(true);
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser?.id) return;
        const res = await fetch("/api/billing/mayar/check-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceId: currentInvoiceId,
            userId: currentUser.id,
          }),
        });
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as {
          status?: string;
          isPremium?: boolean;
        };
        if (data.isPremium) {
          setIsPremium(true);
          setIsUpgradeModalOpen(false);
          setIsCheckingInvoice(false);
          return;
        }
      } finally {
        setIsCheckingInvoice(false);
      }
      setTimeout(poll, 5000);
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [currentInvoiceId, isPremium]);

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[linear-gradient(180deg,#eaf5f0_0%,#f4f9f6_30%,#ffffff_100%)] relative overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onClose={() => setSidebarOpen(false)}
        onSelectConversation={(id) => {
          setActiveConversationId(id);
          fetchConversations();
        }}
        onNewChat={handleNewChat}
      />

      <motion.div
        animate={{ x: sidebarOpen ? 286 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="relative z-20 flex h-full flex-col overflow-hidden bg-[linear-gradient(180deg,#eaf5f0_0%,#f4f9f6_30%,#ffffff_100%)]"
      >
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Tutup sidebar"
            className="absolute inset-0 z-30 bg-emerald-950/15"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-4 pt-5 pb-3 border-b border-emerald-100/60">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-emerald-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-emerald-800" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-700 to-teal-600 flex items-center justify-center shadow-sm shadow-emerald-900/20">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-[15px] text-emerald-950 tracking-tight">
              Mufassir
            </span>
            {isPremium ? (
              <span className="text-[9px] font-bold text-white bg-emerald-700 rounded-full px-2 py-0.5 leading-tight shadow-sm shadow-emerald-900/15">
                Tanpa batas
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 rounded-full px-2 py-0.5 leading-tight border border-emerald-200">
                <span>AI</span>
                <span className="text-[8px] font-semibold text-emerald-600">
                  {promptCount}/10
                </span>
              </span>
            )}
          </div>

          <Link
            href="/"
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-emerald-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-emerald-800" />
          </Link>
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar overscroll-y-contain px-4 pt-3 flex flex-col">
          <AnimatePresence mode="wait">
            {messages.length === 0 && !isTyping ? (
              <EmptyState key="empty" onSuggestion={handleSuggestion} />
            ) : (
              <motion.div
                key="messages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col pt-2 pb-2"
              >
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isStreaming={msg.id === streamingMessageId}
                  />
                ))}
                <TypingIndicator visible={isTyping} />
                <div ref={messagesEndRef} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isPremium && promptCount >= 10 && (
          <div className="px-4 pb-2">
            <div className="mb-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-amber-800">
                  Batas harian tercapai
                </p>
                <p className="text-[11px] text-amber-900/80 mt-0.5">
                  Upgrade ke premium (Rp20.000) untuk tanya Mufassir AI tanpa
                  batas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(true)}
                className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition-colors"
              >
                Upgrade
              </button>
            </div>
          </div>
        )}

        {/* Input bar */}
        <InputBar
          value={input}
          isLoading={isTyping || streamingMessageId !== null}
          onChange={setInput}
          onSubmit={handleSubmit}
        />
      </motion.div>

      <AnimatePresence>
        {isUpgradeModalOpen && !isPremium && (
          <motion.div
            className="fixed inset-0 z-30 flex items-end justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="w-full max-w-sm mx-auto mb-6 rounded-3xl bg-white px  -4 py-4 shadow-xl"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Upgrade ke Mufassir Premium
                  </p>
                  <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                    Kamu sudah memakai 10 pertanyaan gratis hari ini. Dengan
                    Rp20.000 sekali bayar, kamu bisa bertanya ke Mufassir AI
                    tanpa batas setiap hari.
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleCreateInvoice}
                      disabled={isCreatingInvoice}
                      className="w-full rounded-2xl bg-emerald-600 text-white text-xs font-semibold py-2.5 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isCreatingInvoice
                        ? "Membuat invoice…"
                        : "Lanjutkan bayar Rp20.000"}
                    </button>
                    <button
                      type="button"
                      onClick={handleUpgradeDecline}
                      disabled={isCheckingInvoice}
                      className="w-full rounded-2xl border border-gray-200 text-xs font-semibold py-2.5 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Nanti saja
                    </button>
                    {isCheckingInvoice && (
                      <p className="text-[10px] text-gray-500 text-center mt-1">
                        Menunggu konfirmasi pembayaran…
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
