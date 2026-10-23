"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartNoAxesCombined, GraduationCap, LayoutDashboard, LogOut, Menu, Settings2, X, ClipboardList } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/materi", label: "Materi belajar", icon: BookOpen },
  { href: "/latihan", label: "Latihan & kuis", icon: ClipboardList },
  { href: "/admin", label: "Kelola konten", icon: Settings2, staff: true }
];

export function AppShell({ children, name, role }: { children: React.ReactNode; name: string; role: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-[#f7faf8] lg:flex">
      {open && <button aria-label="Tutup menu" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-emerald-950/5 bg-white px-5 py-6 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between"><Link href="/"><span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 font-arabic text-3xl text-white">ع</span><span><b className="block text-lg">ArabEasy</b><small className="arabic text-emerald-700">منصة تعلم اللغة العربية</small></span></span></Link><button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Tutup"><X size={19}/></button></div>
        <p className="mb-3 mt-10 px-3 text-[10px] font-bold tracking-[.18em] text-slate-400">RUANG BELAJAR</p>
        <nav className="space-y-1">
          {nav.filter(item => !item.staff || role === "admin" || role === "teacher").map(item => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
            return <Link onClick={() => setOpen(false)} key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-emerald-50 text-emerald-800" : "text-slate-500 hover:bg-slate-50 hover:text-emerald-800"}`}><Icon size={18}/>{item.label}</Link>;
          })}
        </nav>
        <div className="mt-auto rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
          <div className="mb-2 grid h-8 w-8 place-items-center rounded-lg bg-white text-emerald-700"><GraduationCap size={18}/></div>
          <b className="text-xs">Belajar sedikit setiap hari</b>
          <p className="mt-1 text-xs leading-5 text-slate-500">Konsistensi membantu kosakata dan tata bahasa lebih mudah diingat.</p>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-100 p-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#dff2e6] font-bold text-emerald-800">{name.trim().charAt(0).toUpperCase() || "A"}</span>
          <span className="min-w-0 flex-1"><b className="block truncate text-xs">{name}</b><small className="text-[10px] capitalize text-slate-400">{role}</small></span>
          <button disabled={busy} onClick={logout} aria-label="Keluar" title="Keluar" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><LogOut size={17}/></button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-slate-100 bg-white/90 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3"><button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Buka menu"><Menu size={20}/></button><span className="text-xs text-slate-400">ArabEasy <span className="px-2">/</span><b className="text-slate-700">{nav.find(n => pathname === n.href || pathname.startsWith(n.href + "/"))?.label || "Ruang belajar"}</b></span></div>
          <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700"><span>✦</span> Belajar hari ini</div>
        </header>
        <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10">{children}</div>
        <footer className="border-t border-slate-100 px-6 py-5 text-center text-[11px] text-slate-400">© 2026 ArabEasy · Belajar bahasa, membuka dunia.</footer>
      </main>
    </div>
  );
}
