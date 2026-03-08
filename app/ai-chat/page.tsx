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

// ─── Local DB row types ───────────────────────────────────────────────────────

type ConversationRow = Database["public"]["Tables"]["chat_conversations"]["Row"];
type MessageRow = Database["public"]["Tables"]["chat_messages"]["Row"];

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
    <div className="flex items-end gap-2 mb-4">
      <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-gray-400 block"
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
      className={`flex items-end gap-2 mb-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div
        className={`max-w-[78%] px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-black text-white rounded-2xl rounded-br-sm"
            : "bg-white text-gray-900 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100"
        }`}
      >
        <FormattedMessage content={message.content} />
        {isStreaming && (
          <span className="inline-block w-0.5 h-3.5 bg-gray-400 ml-0.5 align-middle animate-pulse" />
        )}
      </div>
    </motion.div>
  );
}

// ─── FormattedMessage ─────────────────────────────────────────────────────────
// Renders the AI plain-text response with proper formatting:
// - Lines starting with "Arab  :" get an Arabic font class
// - Lines starting with "[AYAT]", "[TAFSIR]" etc. (if leaked) are cleaned
// - Bullet • lines get proper list rendering
// - Everything else is plain <p>

interface FormattedMessageProps {
  content: string;
}

function FormattedMessage({ content }: FormattedMessageProps) {
  const lines = content.split("\n");

  return (
    <span className="block space-y-1">
      {lines.map((line, i) => {
        if (line.trim() === "") {
          return <span key={i} className="block h-2" />;
        }

        // Arabic text line — apply Arabic font and RTL direction
        if (/^[\u0600-\u06FF\u0750-\u077F]/.test(line.trim())) {
          return (
            <span key={i} className="block text-right leading-loose text-base font-arabic" dir="rtl">
              {line}
            </span>
          );
        }

        // Bullet point
        if (line.startsWith("•")) {
          return (
            <span key={i} className="flex gap-2">
              <span className="text-gray-400 flex-shrink-0">•</span>
              <span>{line.slice(1).trim()}</span>
            </span>
          );
        }

        // Section header — lines in ALL CAPS or ending with ":"
        if (/^[A-Z\s]{4,}$/.test(line.trim()) || /^.{3,40}:$/.test(line.trim())) {
          return (
            <span key={i} className="block font-semibold text-gray-900 mt-2">
              {line}
            </span>
          );
        }

        return <span key={i} className="block">{line}</span>;
      })}
    </span>
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
      <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-5 shadow-lg">
        <Sparkles className="w-7 h-7 text-white" />
      </div>
      <h1 className="text-xl font-bold text-gray-900">Mufassir</h1>
      <p className="text-sm text-text-secondary mt-2 max-w-[260px] leading-relaxed">
        Asisten Al-Quran berbasis AI. Tanya apa saja tentang ayat, tafsir, dan ibadah.
      </p>

      {/* Suggestion chips */}
      <div className="mt-8 w-full flex flex-col gap-2">
        {SUGGESTION_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSuggestion(prompt)}
            className="flex items-center justify-between w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-left text-sm text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all shadow-sm"
          >
            <span>{prompt}</span>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
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
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="absolute top-0 left-0 h-full w-[78%] max-w-[300px] bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-sm text-gray-900">Mufassir</span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* New Chat button */}
            <div className="px-3 pt-3 pb-2">
              <button
                onClick={onNewChat}
                className="flex items-center gap-2 w-full bg-black text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-gray-900 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Chat Baru</span>
              </button>
            </div>

            {/* History */}
            <div className="flex-1 overflow-y-auto px-3 pb-6">
              {conversations.length === 0 ? (
                <p className="text-xs text-text-secondary text-center mt-8">
                  Belum ada riwayat percakapan
                </p>
              ) : (
                groupOrder.map((label) => {
                  const items = grouped[label];
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={label} className="mt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary px-1 mb-1">
                        {label}
                      </p>
                      {items.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => {
                            onSelectConversation(conv.id);
                            onClose();
                          }}
                          className={`flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors mb-0.5 ${
                            conv.id === activeConversationId
                              ? "bg-gray-100 font-semibold text-gray-900"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{conv.title}</span>
                        </button>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </motion.aside>
        </>
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

  // Auto-resize textarea up to ~4 lines
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [value]);

  return (
    <div className="px-3 pb-4 pt-2 bg-background">
      <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-[24px] px-3 py-2 shadow-md">
        {/* Microphone */}
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0 mb-0.5"
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
          disabled={!value.trim() || isLoading}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-black text-white flex-shrink-0 mb-0.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800 active:scale-95"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIChatPage() {
  const supabase = createClient();

  // Auth
  const [userId, setUserId] = useState<string | null>(null);

  // Sidebar / conversation list
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Messages & streaming
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Auth ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, [supabase.auth]);

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
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Load messages for a conversation ──────────────────────────────────────
  const loadConversation = useCallback(
    (conversationId: string) => {
      supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .then(({ data }) => {
          if (data) setMessages(data as ChatMessage[]);
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
        firstMessage.length > 40 ? `${firstMessage.slice(0, 40)}…` : firstMessage;
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

  // ── Core send logic — used by both input bar and suggestion chips ─────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      // 1. Show user message immediately (optimistic)
      const tempUserMsgId = `tmp-user-${Date.now()}`;
      const tempUserMsg: ChatMessage = {
        id: tempUserMsgId,
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);
      setIsTyping(true);

      // 2. Ensure we have a conversation (create if new chat)
      let convId = activeConversationId;
      if (!convId) {
        convId = await createConversation(text);
        if (convId) setActiveConversationId(convId);
      }

      // 3. Persist user message to DB & replace temp id
      if (convId) {
        persistMessage(convId, "user", text).then((realId) => {
          if (realId) {
            setMessages((prev) =>
              prev.map((m) => (m.id === tempUserMsgId ? { ...m, id: realId } : m)),
            );
          }
        });
      }

      // 4. Call /api/chat and stream the response
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

        // Add empty AI message and mark it as streaming
        setMessages((prev) => [...prev, tempAiMsg]);
        setStreamingMessageId(tempAiMsgId);
        setIsTyping(false);

        // Read stream chunks and append to the AI message content
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAiMsgId ? { ...m, content: fullContent } : m,
            ),
          );
        }

        setStreamingMessageId(null);

        // 5. Persist AI message to DB & replace temp id
        if (convId && fullContent) {
          persistMessage(convId, "assistant", fullContent).then((realId) => {
            if (realId) {
              setMessages((prev) =>
                prev.map((m) => (m.id === tempAiMsgId ? { ...m, id: realId } : m)),
              );
            }
          });
          touchConversation(convId);
        }
      } catch {
        // Show a friendly error bubble
        setStreamingMessageId(null);
        setIsTyping(false);
        const errorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi.",
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

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
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

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 pt-4 pb-3 bg-background z-10">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>

        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-gray-900">Mufassir</span>
          <span className="text-[10px] font-semibold text-white bg-black rounded-full px-1.5 py-0.5 leading-tight">
            AI
          </span>
        </div>

        <Link
          href="/"
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
      </header>

      {/* ── Chat area ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 flex flex-col">
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

      {/* ── Input bar ───────────────────────────────────────────────────── */}
      <InputBar
        value={input}
        isLoading={isTyping || streamingMessageId !== null}
        onChange={setInput}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
