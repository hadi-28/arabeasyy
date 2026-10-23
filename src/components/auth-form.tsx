"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Brand } from "@/components/brand";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const supabase = createClient();
      if (isRegister) {
        const { data, error: authError } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: name } }
        });
        if (authError) throw authError;
        if (data.session) {
          router.push("/dashboard"); router.refresh();
        } else {
          setNotice("Akun berhasil dibuat. Periksa email untuk verifikasi, lalu masuk ke ArabEasy.");
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.push(params.get("next") || "/dashboard"); router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan. Silakan coba lagi.");
    } finally { setBusy(false); }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.02fr_.98fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-700 to-emerald-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-20 h-96 w-96 rounded-full border border-white/10"/><div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full border border-white/10"/>
        <Brand light/>
        <div className="relative z-10 max-w-lg">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-bold tracking-[.18em]">RUANG BELAJAR BAHASA ARAB</span>
          <h1 className="mt-7 text-5xl font-extrabold leading-tight tracking-tight">Satu kata baru,<br/><span className="text-emerald-200">satu langkah maju.</span></h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-emerald-50/80">Belajar mufradat, memahami nahwu dan sharaf, lalu praktikkan lewat percakapan sehari-hari.</p>
          <p className="arabic mt-8 text-3xl text-emerald-100" dir="rtl">طَلَبُ الْعِلْمِ طَرِيقُ النَّجَاحِ</p>
          <p className="mt-2 text-xs text-emerald-100/70">Belajar adalah jalan menuju keberhasilan.</p>
        </div>
        <p className="relative z-10 text-xs text-emerald-100/70">ArabEasy · منصة تعلم اللغة العربية</p>
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden"><Brand/></div>
          <p className="text-xs font-bold tracking-[.17em] text-emerald-700">{isRegister ? "MULAI PERJALANANMU" : "SELAMAT DATANG KEMBALI"}</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">{isRegister ? "Buat akun ArabEasy" : "Masuk ke akunmu"}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{isRegister ? "Bergabung dan simpan progres belajarmu." : "Lanjutkan perjalanan belajar Bahasa Arab."}</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {isRegister && <label className="block text-xs font-semibold text-slate-700">Nama lengkap<input required value={name} onChange={e=>setName(e.target.value)} autoComplete="name" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-normal outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" placeholder="Nama kamu"/></label>}
            <label className="block text-xs font-semibold text-slate-700">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-normal outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" placeholder="nama@email.com"/></label>
            <label className="block text-xs font-semibold text-slate-700">Kata sandi<div className="relative mt-2"><input required minLength={8} type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={isRegister?"new-password":"current-password"} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-12 text-sm font-normal outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" placeholder="Minimal 8 karakter"/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?"Sembunyikan kata sandi":"Tampilkan kata sandi"} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
            {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">{error}</p>}
            {notice && <p role="status" className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">{notice}</p>}
            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800 disabled:opacity-60">{busy?<LoaderCircle className="animate-spin" size={17}/>:null}{isRegister?"Buat akun":"Masuk"}{!busy&&<ArrowRight size={17}/>}</button>
          </form>
          <p className="mt-7 text-center text-xs text-slate-500">{isRegister?"Sudah punya akun?":"Belum punya akun?"} <Link className="font-bold text-emerald-700 hover:text-emerald-900" href={isRegister?"/login":"/register"}>{isRegister?"Masuk":"Daftar sekarang"}</Link></p>
          <p className="mt-8 text-center text-[10px] leading-5 text-slate-400">Dengan melanjutkan, kamu menggunakan platform pembelajaran ArabEasy. Jangan gunakan kata sandi yang sama dengan akun penting lainnya.</p>
        </div>
      </section>
    </main>
  );
}
