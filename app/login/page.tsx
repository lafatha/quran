"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { BookOpen, Mail, Lock, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "masuk" | "daftar";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.6-2.5C16.9 3.4 14.7 2.5 12 2.5A9.5 9.5 0 0 0 2.5 12 9.5 9.5 0 0 0 12 21.5c5.5 0 9.1-3.8 9.1-9.2 0-.6-.1-1.1-.2-1.6H12Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("masuk");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const error = searchParams.get("error");
    if (error) {
      setMessage("Autentikasi gagal. Coba lagi.");
    }
  }, []);

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
      setMessage(error.message);
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
        setMessage(error.message);
        setLoading(false);
        return;
      }
      router.replace("/");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Akun berhasil dibuat. Silakan login.");
    setMode("masuk");
    setPassword("");
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background px-5 py-8">
      <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="mb-8 pt-3">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-black flex items-center justify-center shadow-sm">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-center text-2xl font-bold mt-4">Quran AI</h1>
        <p className="text-center text-sm text-text-secondary mt-1">Masuk untuk melanjutkan bacaan harianmu</p>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        custom={1}
        variants={fadeUp}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
      >
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setMode("masuk")}
            className={`flex-1 py-2 text-sm rounded-lg font-semibold transition-colors ${mode === "masuk" ? "bg-white text-black shadow-sm" : "text-text-secondary"}`}
          >
            Masuk
          </button>
          <button
            onClick={() => setMode("daftar")}
            className={`flex-1 py-2 text-sm rounded-lg font-semibold transition-colors ${mode === "daftar" ? "bg-white text-black shadow-sm" : "text-text-secondary"}`}
          >
            Daftar
          </button>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mt-4 w-full border border-gray-200 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          <GoogleIcon />
          Lanjut dengan Google
        </button>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-xs text-text-secondary">atau</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          {mode === "daftar" && (
            <div className="relative">
              <UserRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                required
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nama lengkap"
                className="w-full h-11 rounded-xl border border-gray-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="w-full h-11 rounded-xl border border-gray-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              required
              minLength={6}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full h-11 rounded-xl border border-gray-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-black text-white text-sm font-semibold disabled:opacity-60"
          >
            {mode === "masuk" ? "Masuk" : "Daftar"}
          </button>
        </form>

        {message && <p className="mt-3 text-xs text-center text-text-secondary">{message}</p>}
      </motion.div>
    </div>
  );
}
