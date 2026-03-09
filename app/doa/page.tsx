"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, BookOpen, X, Sparkles } from "lucide-react";

interface DoaItem {
  id: number;
  grup: string;
  nama: string;
  ar: string;
  tr: string;
  idn: string;
  tentang: string;
  tag: string[];
}

interface DoaResponse {
  status: string;
  total: number;
  data: DoaItem[];
}

const ALL_LABEL = "Semua";

export default function DoaPage() {
  const [doaList, setDoaList] = useState<DoaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGrup, setSelectedGrup] = useState(ALL_LABEL);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/doa_full.json")
      .then((res) => res.json())
      .then((json: DoaResponse) => {
        setDoaList(json.data);
        setLoading(false);
      });
  }, []);

  const groups = [
    ALL_LABEL,
    ...Array.from(new Set(doaList.map((item) => item.grup))),
  ];

  const filtered = doaList.filter((item) => {
    const query = search.toLowerCase();
    const matchSearch =
      !query ||
      item.nama.toLowerCase().includes(query) ||
      item.idn.toLowerCase().includes(query) ||
      item.tr.toLowerCase().includes(query) ||
      item.ar.includes(query) ||
      item.tag.some((t) => t.toLowerCase().includes(query)) ||
      item.grup.toLowerCase().includes(query);
    const matchGroup = selectedGrup === ALL_LABEL || item.grup === selectedGrup;
    return matchSearch && matchGroup;
  });

  function handleClearSearch() {
    setSearch("");
    searchRef.current?.focus();
  }

  function handleToggle(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function handleGrupSelect(grup: string) {
    setSelectedGrup(grup);
    setExpandedId(null);
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef7f4_0%,#f7faf8_28%,#ffffff_100%)] pb-28">
      {/* Header */}
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[1.85rem] font-bold tracking-tight text-emerald-950">
              Doa & Dzikir
            </h1>
            <p className="mt-0.5 text-sm text-emerald-700/70">
              {loading ? "Memuat doa..." : `${doaList.length} doa tersedia`}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 shadow-md shadow-emerald-900/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Cari doa, kata kunci, atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-emerald-100 bg-white py-3.5 pl-10 pr-10 text-sm shadow-sm shadow-emerald-500/5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category chips */}
      <div className="overflow-x-auto pb-1 hide-scrollbar">
        <div className="flex gap-2 px-5 py-2 w-max">
          {groups.map((grup) => (
            <button
              key={grup}
              type="button"
              onClick={() => handleGrupSelect(grup)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                selectedGrup === grup
                  ? "bg-emerald-700 text-white shadow-md shadow-emerald-900/20"
                  : "bg-white text-gray-600 border border-emerald-100 hover:border-emerald-300"
              }`}
            >
              {grup === ALL_LABEL ? "✦ Semua" : grup.replace(/^Doa /i, "")}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <div className="px-5 pt-2 pb-1">
        <p className="text-xs font-medium text-gray-400">
          {loading
            ? "Memuat..."
            : `${filtered.length} dari ${doaList.length} doa${search ? ` untuk "${search}"` : ""}`}
        </p>
      </div>

      {/* Doa list */}
      <div className="px-4 pt-2 space-y-3">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-[24px] bg-white p-5 shadow-sm"
            >
              <div className="mb-3 h-3 w-1/3 rounded-full bg-emerald-100" />
              <div className="mb-4 h-4 w-2/3 rounded-full bg-gray-100" />
              <div className="space-y-2">
                <div className="h-6 w-full rounded-full bg-gray-100" />
                <div className="h-6 w-4/5 rounded-full bg-gray-100" />
              </div>
            </div>
          ))}

        {!loading && filtered.length === 0 && (
          <div className="mt-12 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50">
              <BookOpen className="h-7 w-7 text-emerald-400" />
            </div>
            <p className="mt-4 text-base font-semibold text-gray-700">
              Doa tidak ditemukan
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Coba kata kunci lain atau pilih kategori yang berbeda.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedGrup(ALL_LABEL);
              }}
              className="mt-5 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/20"
            >
              Reset Pencarian
            </button>
          </div>
        )}

        {!loading &&
          filtered.map((doa, index) => (
            <motion.div
              key={doa.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.2,
                delay: index < 12 ? index * 0.03 : 0,
              }}
              className="overflow-hidden rounded-[24px] border border-emerald-100 bg-white shadow-sm shadow-emerald-950/5"
            >
              {/* Card header */}
              <button
                type="button"
                onClick={() => handleToggle(doa.id)}
                className="w-full text-left px-5 pt-5 pb-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Group badge */}
                    <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">
                      {doa.grup}
                    </span>
                    {/* Name */}
                    <p className="text-[15px] font-bold tracking-tight text-gray-900 leading-snug">
                      {doa.nama}
                    </p>
                  </div>
                  <div
                    className={`mt-1 shrink-0 flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                      expandedId === doa.id
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-emerald-200 bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-300 ${
                        expandedId === doa.id ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Arabic text */}
                <p className="arabic-text mt-4 text-2xl leading-loose text-emerald-950">
                  {doa.ar}
                </p>

                {/* Transliteration */}
                <p className="mt-3 text-sm italic text-emerald-700/80 leading-relaxed">
                  {doa.tr}
                </p>
              </button>

              {/* Translation always visible */}
              <div className="px-5 pb-4">
                <div className="rounded-2xl bg-emerald-50/70 px-4 py-3">
                  <p className="text-[13px] leading-relaxed text-gray-700">
                    <span className="mr-1 text-emerald-600 font-semibold text-xs uppercase tracking-wider">
                      Artinya:
                    </span>
                    {doa.idn}
                  </p>
                </div>

                {/* Tags */}
                {doa.tag.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {doa.tag.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setSearch(t);
                          setSelectedGrup(ALL_LABEL);
                        }}
                        className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Expandable: Tentang */}
              <AnimatePresence initial={false}>
                {expandedId === doa.id && doa.tentang && (
                  <motion.div
                    key="tentang"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-emerald-100 mx-5 mb-5 pt-4">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                        Keterangan
                      </p>
                      <p className="text-[13px] leading-relaxed text-gray-600 whitespace-pre-line">
                        {doa.tentang}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
      </div>

      {/* Bottom padding handled by pb-28 on parent */}
    </div>
  );
}
