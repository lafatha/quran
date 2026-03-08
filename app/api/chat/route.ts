import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatRagContext } from "@/lib/chat";
import type { VectorResponse, ChatApiRequest } from "@/lib/chat";

// ─── Config ───────────────────────────────────────────────────────────────────

const CEREBRAS_API_URL = "https://api.cerebras.ai/v1/chat/completions";
const CEREBRAS_MODEL = "llama-4-scout-17b-16e-instruct";
const EQURAN_VECTOR_URL = "https://equran.id/api/vector";

// Max previous messages to include for context memory (keeps token cost low)
const MAX_HISTORY_MESSAGES = 10;

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Kamu adalah Mufassir, asisten Al-Quran berbasis AI yang membantu umat Muslim memahami Al-Quran, tafsir, dan ajaran Islam.

ATURAN JAWABAN:
- Jawab dalam Bahasa Indonesia yang baik, jelas, dan mudah dipahami
- Tulis teks Arab apa adanya tanpa modifikasi, contoh: يَا أَيُّهَا الَّذِينَ آمَنُوا
- Referensi ayat ditulis: (QS. NamaSurah: nomor_ayat)
- Gunakan bullet • untuk poin-poin, BUKAN tanda bintang atau dash
- Untuk penekanan kata, gunakan HURUF KAPITAL — JANGAN gunakan **tanda bintang**
- Jangan pernah menulis ** atau * dalam jawaban
- Jawab ringkas dan padat, tidak bertele-tele
- Jika ada konteks ayat dari Al-Quran yang diberikan, jadikan itu referensi utama jawaban
- Jika tidak ada konteks yang relevan, jawab berdasarkan pengetahuanmu tentang Islam`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchVectorContext(query: string): Promise<string> {
  try {
    const res = await fetch(EQURAN_VECTOR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cari: query,
        batas: 5,
        tipe: ["ayat", "tafsir"],
        skorMin: 0.45,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return "";

    const json = (await res.json()) as VectorResponse;
    if (json.status !== "sukses" || !json.hasil?.length) return "";

    return formatRagContext(json.hasil);
  } catch {
    // Vector search is best-effort — never block the response if it fails
    return "";
  }
}

async function fetchChatHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const { data } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(MAX_HISTORY_MESSAGES);

  if (!data) return [];
  // Return in chronological order (was fetched desc for the LIMIT to grab latest)
  return (data as Array<{ role: "user" | "assistant"; content: string }>).reverse();
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<Response> {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
  }

  let body: ChatApiRequest;
  try {
    body = (await req.json()) as ChatApiRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { query, conversationId, userId } = body;

  if (!query?.trim()) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  // ── 1. Parallel: fetch RAG context + chat history ─────────────────────────
  const supabase = await createClient();

  const [ragContext, chatHistory] = await Promise.all([
    fetchVectorContext(query),
    conversationId ? fetchChatHistory(supabase, conversationId) : Promise.resolve([]),
  ]);

  // ── 2. Build messages array for Cerebras ──────────────────────────────────
  const systemContent =
    ragContext.length > 0
      ? `${SYSTEM_PROMPT}\n\nKONTEKS AL-QURAN YANG RELEVAN:\n${ragContext}`
      : SYSTEM_PROMPT;

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemContent },
    // Inject chat history for context memory
    ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
    // Current user query
    { role: "user", content: query },
  ];

  // ── 3. Call Cerebras API with streaming ───────────────────────────────────
  let cerebrasRes: Response;
  try {
    cerebrasRes = await fetch(CEREBRAS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: CEREBRAS_MODEL,
        messages,
        stream: true,
        max_completion_tokens: 1024,
        temperature: 0.7,
      }),
    });
  } catch {
    return NextResponse.json({ error: "Failed to reach AI service" }, { status: 502 });
  }

  if (!cerebrasRes.ok) {
    const errText = await cerebrasRes.text();
    console.error("Cerebras error:", cerebrasRes.status, errText);
    return NextResponse.json({ error: "AI service error" }, { status: 502 });
  }

  if (!cerebrasRes.body) {
    return NextResponse.json({ error: "No response body from AI" }, { status: 502 });
  }

  // ── 4. Stream Cerebras SSE → client as plain text stream ─────────────────
  // We pipe Cerebras's SSE (data: {"choices":[{"delta":{"content":"..."}}]})
  // and emit only the raw text content chunks, newline-delimited.
  // The client reads these chunks and appends them to the message bubble.
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const readable = new ReadableStream({
    async start(controller) {
      const reader = cerebrasRes.body!.getReader();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // Keep the last (potentially incomplete) line in the buffer
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const jsonStr = trimmed.slice(5).trim();
            if (jsonStr === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const parsed = JSON.parse(jsonStr) as {
                choices: Array<{ delta: { content?: string }; finish_reason?: string }>;
              };
              const chunk = parsed.choices?.[0]?.delta?.content;
              if (chunk) {
                controller.enqueue(encoder.encode(chunk));
              }
              if (parsed.choices?.[0]?.finish_reason === "stop") {
                controller.close();
                return;
              }
            } catch {
              // Malformed JSON chunk — skip silently
            }
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        reader.releaseLock();
      }
    },
  });

  // Log context usage for debugging (server-side only)
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Mufassir] user=${userId ?? "anon"} conv=${conversationId ?? "new"} ` +
        `rag=${ragContext.length > 0 ? "yes" : "no"} history=${chatHistory.length}msg`,
    );
  }

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
