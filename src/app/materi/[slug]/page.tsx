import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Volume2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { MarkCompleteButton } from "@/components/mark-complete-button";

export default async function MaterialDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: material }, { data: progress }] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle(),
    supabase.from("materials").select("id, slug, title, arabic, level, minutes, summary, content, category_id, categories(title, arabic)").eq("slug", slug).eq("published", true).maybeSingle(),
    supabase.from("user_progress").select("material_id").eq("user_id", user.id)
  ]);
  if (!material) notFound();
  const { data: vocabulary } = await supabase.from("vocabulary").select("id, arabic, transliteration, meaning, example_ar, example_id").eq("material_id", material.id).order("sort_order");
  const completed = (progress||[]).some(p=>p.material_id===material.id);
  const name = profile?.full_name || user.email?.split("@")[0] || "Pelajar";
  const category:any = Array.isArray(material.categories)?material.categories[0]:material.categories;
  return <AppShell name={name} role={profile?.role||"student"}>
    <Link href="/materi" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700"><ArrowLeft size={15}/> Kembali ke materi</Link>
    <article className="mx-auto mt-4 max-w-4xl rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-9">
      <div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-800">{category?.title||"Materi"}</span><span className="text-[10px] text-slate-400">Level {material.level} · {material.minutes} menit</span></div>
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight">{material.title}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{material.summary}</p>
      <div className="my-7 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-700 px-5 py-8 text-center text-white"><p className="arabic text-4xl sm:text-5xl" dir="rtl">{material.arabic}</p><p className="arabic mt-3 text-lg text-emerald-100" dir="rtl">{category?.arabic||""}</p></div>
      <div className="prose prose-slate max-w-none"><h2 className="text-lg font-extrabold">Penjelasan materi</h2><p className="whitespace-pre-line text-sm leading-7 text-slate-600">{material.content}</p></div>
      <div className="mt-8"><h2 className="text-lg font-extrabold">Kosakata dan contoh</h2>{vocabulary?.length?<div className="mt-4 grid gap-3 sm:grid-cols-2">{vocabulary.map(v=><div key={v.id} className="rounded-2xl border border-slate-100 p-4"><p className="arabic text-3xl text-emerald-700" dir="rtl">{v.arabic}</p><p className="mt-1 text-xs text-slate-400">{v.transliteration}</p><p className="mt-2 font-bold">{v.meaning}</p>{v.example_ar&&<p className="arabic mt-3 rounded-lg bg-emerald-50 p-3 text-lg text-emerald-800" dir="rtl">{v.example_ar}</p>}{v.example_id&&<p className="mt-2 text-xs leading-5 text-slate-500">{v.example_id}</p>}</div>)}</div>:<div className="mt-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">Belum ada kosakata untuk materi ini.</div>}</div>
      <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6"><MarkCompleteButton materialId={material.id} initiallyCompleted={completed}/><Link href="/latihan" className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 hover:border-emerald-200 hover:text-emerald-800">Latihan interaktif →</Link></div>
    </article>
  </AppShell>;
}
