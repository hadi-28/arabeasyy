import { AppShell } from "@/components/app-shell";
import { QuizRunner } from "@/components/quiz-runner";
import { requireUser } from "@/lib/auth";

export default async function PracticePage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id",user.id).maybeSingle();
  const name=profile?.full_name||user.email?.split("@")[0]||"Pelajar";
  return <AppShell name={name} role={profile?.role||"student"}><div className="mb-6"><p className="text-[10px] font-bold tracking-[.18em] text-emerald-700">ASAH KEMAMPUANMU</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Latihan <span className="text-emerald-700">interaktif</span></h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Jawab soal, dapatkan pembahasan, dan kumpulkan XP. Nilai dihitung serta disimpan di server agar progres terhubung dengan akunmu.</p></div><QuizRunner/></AppShell>;
}
