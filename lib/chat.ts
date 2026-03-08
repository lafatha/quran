// ─── Shared types & helpers for the Mufassir AI chat feature ─────────────────

// ── Message types ─────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

// ── equran.id Vector API types ────────────────────────────────────────────────

interface VectorAyatData {
  id_surat: number;
  nama_surat: string;
  nama_surat_arab: string;
  nomor_ayat: number;
  teks_arab: string;
  teks_latin: string;
  terjemahan_id: string;
}

interface VectorTafsirData {
  id_surat: number;
  nama_surat: string;
  nomor_ayat: number;
  isi: string;
}

interface VectorSuratData {
  id: number;
  nama: string;
  nama_arab: string;
  arti: string;
  deskripsi: string;
}

interface VectorDoaData {
  judul: string;
  teks_arab: string;
  teks_latin: string;
  arti: string;
  sumber?: string;
}

type VectorData = VectorAyatData | VectorTafsirData | VectorSuratData | VectorDoaData;

export interface VectorResult {
  tipe: "ayat" | "tafsir" | "surat" | "doa";
  skor: number;
  relevansi: "tinggi" | "sedang" | "rendah";
  data: VectorData;
}

export interface VectorResponse {
  status: string;
  cari: string;
  jumlah: number;
  hasil: VectorResult[];
}

// ── RAG context builder ───────────────────────────────────────────────────────

/**
 * Converts vector search results into a clean, structured plain-text block
 * that is injected into the LLM system prompt as grounding context.
 */
export function formatRagContext(results: VectorResult[]): string {
  if (results.length === 0) return "";

  const sections: string[] = [];

  for (const result of results) {
    if (result.tipe === "ayat") {
      const d = result.data as VectorAyatData;
      sections.push(
        [
          `[AYAT] QS. ${d.nama_surat} (${d.nama_surat_arab}): ${d.nomor_ayat}`,
          `Arab  : ${d.teks_arab}`,
          `Latin : ${d.teks_latin}`,
          `Arti  : ${d.terjemahan_id}`,
        ].join("\n"),
      );
    } else if (result.tipe === "tafsir") {
      const d = result.data as VectorTafsirData;
      sections.push(
        [
          `[TAFSIR] QS. ${d.nama_surat}: ${d.nomor_ayat}`,
          d.isi,
        ].join("\n"),
      );
    } else if (result.tipe === "surat") {
      const d = result.data as VectorSuratData;
      sections.push(
        [
          `[SURAT] ${d.nama} (${d.nama_arab}) — Arti: ${d.arti}`,
          d.deskripsi,
        ].join("\n"),
      );
    } else if (result.tipe === "doa") {
      const d = result.data as VectorDoaData;
      sections.push(
        [
          `[DOA] ${d.judul}`,
          `Arab  : ${d.teks_arab}`,
          `Latin : ${d.teks_latin}`,
          `Arti  : ${d.arti}`,
          d.sumber ? `Sumber: ${d.sumber}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }
  }

  return sections.join("\n\n");
}

// ── Token estimator ───────────────────────────────────────────────────────────

/** Rough estimate: 1 token ≈ 4 characters (good enough for budget tracking). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ── Chat API request/response types ──────────────────────────────────────────

export interface ChatApiRequest {
  query: string;
  conversationId: string | null;
  userId: string | null;
}

// The API route streams raw text chunks; no structured response type needed.
