import Link from "next/link";
import { ArrowRight, BookOpen, Brain, CheckCircle2, GraduationCap, Languages, Sparkles } from "lucide-react";
import { Brand } from "@/components/brand";

const features = [
  { icon: BookOpen, title: "Materi terstruktur", text: "Pelajari Mufradat, Nahwu, Sharaf, dan Hiwar berdasarkan tingkat kemampuan." },
  { icon: Brain, title: "Latihan interaktif", text: "Uji pemahaman dengan soal pilihan ganda dan pembahasan langsung." },
  { icon: CheckCircle2, title: "Progres tersimpan", text: "Lihat nilai, riwayat latihan, dan perkembangan belajar melalui akunmu." }
];

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-[#f8fbf8]">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Brand/>
        <nav className="flex items-center gap-3"><Link href="/login" className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-white">Masuk</Link><Link href="/register" className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800">Mulai belajar <ArrowRight className="ml-1 inline" size={14}/></Link></nav>
      </header>
      <section className="page-grid relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-20 pt-10 sm:px-8 md:pt-16 lg:grid-cols-[1.1fr_.9fr] lg:pb-28">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-[10px] font-bold tracking-[.12em] text-emerald-800"><Sparkles size={13}/> PLATFORM PEMBELAJARAN BAHASA ARAB</span>
          <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.12] tracking-[-.05em] text-ink sm:text-5xl lg:text-6xl">Belajar Bahasa Arab,<br/><span className="text-emerald-700">lebih mudah setiap hari.</span></h1>
          <p className="arabic mt-6 text-2xl text-emerald-800 sm:text-3xl" dir="rtl">أَهْلًا وَسَهْلًا بِكُمْ فِي عَالَمِ اللُّغَةِ الْعَرَبِيَّةِ</p>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600">Pelajari Bahasa Arab melalui materi yang terstruktur, latihan interaktif, percakapan sehari-hari, dan evaluasi yang membantumu memahami kemajuan belajar.</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link href="/register" className="rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-800">Buat akun gratis <ArrowRight className="ml-2 inline" size={16}/></Link><Link href="/login" className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-emerald-200">Saya sudah punya akun</Link></div>
          <div className="mt-8 flex items-center gap-4 text-xs text-slate-500"><span className="flex -space-x-2"><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#f8fbf8] bg-emerald-100 font-arabic text-emerald-800">ع</span><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#f8fbf8] bg-amber-100">✦</span><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#f8fbf8] bg-blue-100"><GraduationCap size={15}/></span></span><span>Belajar mandiri untuk pelajar dan mahasiswa</span></div>
        </div>
        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute inset-8 rounded-full bg-emerald-200/40 blur-3xl"/>
          <div className="relative rounded-[2rem] border border-white bg-white/85 p-5 shadow-[0_30px_90px_rgba(7,90,61,.13)] backdrop-blur sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5"><div><p className="text-[10px] font-bold tracking-[.16em] text-slate-400">RUANG BELAJAR</p><h2 className="mt-1 text-lg font-extrabold">Mulai dari dasar</h2></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Languages size={22}/></span></div>
            <div className="mt-5 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-600 p-5 text-white"><p className="text-[10px] font-bold tracking-[.15em] text-emerald-100">KOSAKATA HARI INI</p><p className="arabic mt-3 text-4xl" dir="rtl">مَدْرَسَةٌ</p><p className="mt-1 text-sm text-emerald-50">madrasatun · sekolah</p><div className="mt-5 h-px bg-white/20"/><p className="arabic mt-4 text-xl" dir="rtl">هَذِهِ مَدْرَسَةٌ</p><p className="mt-1 text-xs text-emerald-100">Ini adalah sekolah.</p></div>
            <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-slate-100 p-4"><span className="text-[10px] text-slate-400">Kategori materi</span><b className="mt-1 block text-sm">4 kategori</b><div className="mt-3 flex gap-1"><span className="h-1.5 flex-1 rounded-full bg-emerald-600"/><span className="h-1.5 flex-1 rounded-full bg-amber-300"/><span className="h-1.5 flex-1 rounded-full bg-orange-300"/><span className="h-1.5 flex-1 rounded-full bg-blue-300"/></div></div><div className="rounded-2xl border border-slate-100 p-4"><span className="text-[10px] text-slate-400">Cara belajar</span><b className="mt-1 block text-sm">Baca & praktik</b><p className="mt-2 text-[10px] text-slate-500">Materi · Kuis · Evaluasi</p></div></div>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-amber-50 p-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-amber-600"><Sparkles size={17}/></span><p className="text-xs leading-5 text-amber-900"><b>Satu langkah setiap hari.</b><br/>Kemajuan dimulai dari kebiasaan kecil.</p></div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-xl text-center"><p className="text-[10px] font-bold tracking-[.18em] text-emerald-700">BELAJAR DENGAN TERARAH</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">Semua yang kamu butuhkan untuk berkembang</h2><p className="mt-3 text-sm leading-6 text-slate-500">Fondasi belajar yang bisa terus dikembangkan sesuai kebutuhan pelajar, dosen, dan pengelola materi.</p></div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">{features.map((feature)=>{const Icon=feature.icon;return <article key={feature.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon size={23}/></span><h3 className="mt-5 text-base font-bold">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{feature.text}</p></article>})}</div>
      </section>
      <section className="mx-5 mb-12 rounded-[2rem] bg-emerald-900 px-6 py-12 text-center text-white sm:mx-8 sm:px-10"><p className="arabic text-2xl text-emerald-100" dir="rtl">بِدَايَةٌ صَغِيرَةٌ، تَقَدُّمٌ كَبِيرٌ</p><h2 className="mt-4 text-2xl font-extrabold">Siap memulai perjalananmu?</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-emerald-100/80">Buat akun dan mulai simpan materi, nilai, serta progres belajarmu di satu tempat.</p><Link href="/register" className="mt-6 inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50">Mulai belajar sekarang <ArrowRight className="ml-2" size={16}/></Link></section>
      <footer className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-5 pb-7 text-xs text-slate-400 sm:flex-row sm:px-8"><Brand/><span>© 2026 ArabEasy · منصة تعلم اللغة العربية</span></footer>
    </main>
  );
}
