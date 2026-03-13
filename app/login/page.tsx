"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, UserRound, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "masuk" | "daftar";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.6-2.5C16.9 3.4 14.7 2.5 12 2.5A9.5 9.5 0 0 0 2.5 12 9.5 9.5 0 0 0 12 21.5c5.5 0 9.1-3.8 9.1-9.2 0-.6-.1-1.1-.2-1.6H12Z"
      />
    </svg>
  );
}

function QuranLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="5" r="1.4" />
      <circle cx="17.7" cy="7.3" r="1.4" />
      <circle cx="20" cy="13" r="1.4" />
      <circle cx="17.7" cy="18.7" r="1.4" />
      <circle cx="12" cy="21" r="1.4" />
      <circle cx="6.3" cy="18.7" r="1.4" />
      <circle cx="4" cy="13" r="1.4" />
      <circle cx="6.3" cy="7.3" r="1.4" />
      <path d="M12 5 L12 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <circle cx="12" cy="1.5" r="1.2" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("masuk");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const error = searchParams.get("error");
    if (error) {
      setMessage({ text: "Autentikasi gagal. Silakan coba lagi.", type: "error" });
    }
  }, []);

  function switchMode(next: AuthMode) {
    setMode(next);
    setMessage(null);
    setName("");
    setPassword("");
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });

    if (error) {
      setMessage({ text: error.message, type: "error" });
      setLoading(false);
      return;
    }

    if (data.url) {
      router.push(data.url);
      return;
    }

    setLoading(false);
  }

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    if (mode === "masuk") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ text: "Email atau password salah. Periksa kembali.", type: "error" });
        setLoading(false);
        return;
      }
      router.replace("/");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      setMessage({ text: error.message, type: "error" });
      setLoading(false);
      return;
    }

    setMessage({ text: "Akun berhasil dibuat! Silakan masuk.", type: "success" });
    switchMode("masuk");
    setLoading(false);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#022c22_0%,#064e3b_45%,#065f46_100%)]">
      {/* Decorative background rings */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full border-[20px] border-white/5" />
      <div className="pointer-events-none absolute -right-6 top-20 h-44 w-44 rounded-full border-[14px] border-white/8" />
      <div className="pointer-events-none absolute right-14 top-44 h-16 w-16 rounded-full border-[5px] border-emerald-400/20" />
      <div className="pointer-events-none absolute -left-12 bottom-40 h-56 w-56 rounded-full border-[16px] border-white/5" />

      {/* Top hero section */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 px-6 pt-16 pb-10 text-center"
      >
        {/* Logo badge */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/15 text-white shadow-lg shadow-black/20 backdrop-blur-sm ring-1 ring-white/20">
          <QuranLogo />
        </div>
        <h1 className="text-[2rem] font-bold tracking-tight leading-none text-white">
          Quran AI
        </h1>
        <p className="mt-2.5 text-[14px] leading-relaxed text-emerald-200/80">
          Tracker bacaan harian & panduan Islam
          <br />
          berbasis kecerdasan buatan
        </p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
        className="relative z-10 mx-4 rounded-[32px] bg-white shadow-2xl shadow-black/30"
      >
        {/* Mode toggle */}
        <div className="px-5 pt-5">
          <div className="flex rounded-2xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => switchMode("masuk")}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                mode === "masuk"
                  ? "bg-white text-gray-950 shadow-sm"
                  : "text-gray-400"
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => switchMode("daftar")}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                mode === "daftar"
                  ? "bg-white text-gray-950 shadow-sm"
                  : "text-gray-400"
              }`}
            >
              Daftar
            </button>
          </div>
        </div>

        <div className="px-5 pb-6 pt-4">
          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-gray-200 bg-white py-3.5 text-[14px] font-semibold text-gray-800 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-60"
          >
            <GoogleIcon />
            Lanjut dengan Google
          </button>

          {/* Divider */}
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[12px] font-medium text-gray-400">atau dengan email</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <AnimatePresence initial={false}>
              {mode === "daftar" && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="relative pb-0.5">
                    <UserRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama lengkap"
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-[14px] text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Alamat email"
                className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-[14px] text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                required
                minLength={6}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min. 6 karakter)"
                className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-10 pr-11 text-[14px] text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Error / success message */}
            <AnimatePresence initial={false}>
              {message && (
                <motion.div
                  key="msg"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p
                    className={`rounded-xl px-3.5 py-2.5 text-[13px] font-medium ${
                      message.type === "error"
                        ? "bg-red-50 text-red-600"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {message.text}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-600 text-[14px] font-semibold text-white shadow-md shadow-emerald-900/25 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : null}
              {mode === "masuk" ? "Masuk" : "Buat Akun"}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="relative z-10 mt-6 pb-10 text-center text-[12px] text-emerald-300/50"
      >
        Dengan masuk, kamu menyetujui syarat & kebijakan privasi.
      </motion.p>
    </div>
  );
}
