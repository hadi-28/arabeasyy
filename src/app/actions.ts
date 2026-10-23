"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getSignedInUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: "Sesi login tidak ditemukan. Silakan masuk kembali." as const };
  return { user, supabase };
}

async function isStaff(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  return !!data && ["admin", "teacher"].includes(data.role);
}

const AnswerSchema = z.array(z.object({
  questionId: z.string().uuid(),
  optionId: z.string().uuid()
})).length(10);

export type PublicQuizQuestion = {
  id: string;
  prompt: string;
  prompt_arabic: string | null;
  hint: string | null;
  level: number;
  question_type: string;
  category: string;
  options: { id: string; label: string }[];
};

export async function startQuiz(categorySlug: string = "all", level: number | null = null): Promise<{ questions?: PublicQuizQuestion[]; error?: string }> {
  const auth = await getSignedInUser();
  if ("error" in auth) return { error: auth.error };
  const admin = createAdminClient();
  const { data, error } = await admin.from("questions")
    .select("id, prompt, prompt_arabic, hint, level, question_type, categories(slug), question_options(id, label)")
    .eq("published", true);
  if (error) return { error: "Bank soal belum tersedia. Periksa konfigurasi database." };

  const allQuestions: PublicQuizQuestion[] = (data || []).map((q: any) => ({
    id: q.id,
    prompt: q.prompt,
    prompt_arabic: q.prompt_arabic,
    hint: q.hint,
    level: q.level,
    question_type: q.question_type,
    category: Array.isArray(q.categories) ? q.categories[0]?.slug : q.categories?.slug,
    options: (q.question_options || []).map((o: any) => ({ id: o.id, label: o.label }))
  })).filter((q) => q.options.length >= 2);

  const preferred = allQuestions.filter((q) =>
    (categorySlug === "all" || q.category === categorySlug) &&
    (!level || q.level === level)
  );
  // Fill a 10-question session with other published questions when the selected filter has fewer than 10.
  const preferredIds = new Set(preferred.map((q) => q.id));
  const fallback = allQuestions.filter((q) => !preferredIds.has(q.id));
  const pool = preferred.length >= 10 ? preferred : preferred.concat(fallback);
  if (pool.length === 0) return { error: "Belum ada soal. Tambahkan soal melalui database sebelum memulai latihan." };

  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, Math.min(10, pool.length))
    .map((q) => ({ ...q, options: q.options.sort(() => Math.random() - 0.5) }));
  if (shuffled.length < 10) return { error: "Bank soal perlu berisi minimal 10 soal aktif untuk menjalankan sesi lengkap." };
  return { questions: shuffled };
}

export async function checkQuizAnswer(questionId: string, optionId: string): Promise<{ correct?: boolean; explanation?: string; correctOptionId?: string; error?: string }> {
  const auth = await getSignedInUser();
  if ("error" in auth) return { error: auth.error };
  if (!z.string().uuid().safeParse(questionId).success || !z.string().uuid().safeParse(optionId).success) return { error: "Pilihan jawaban tidak valid." };
  const admin = createAdminClient();
  const { data: question } = await admin.from("questions").select("id, explanation, question_options(id, is_correct)").eq("id", questionId).eq("published", true).maybeSingle();
  if (!question) return { error: "Soal tidak ditemukan." };
  const options:any[] = question.question_options || [];
  const selected = options.find(o=>o.id===optionId);
  if (!selected) return { error: "Pilihan tersebut tidak termasuk dalam soal ini." };
  const correctOption = options.find(o=>o.is_correct);
  return { correct:!!selected.is_correct, explanation:question.explanation||"", correctOptionId:correctOption?.id };
}

export async function finishQuiz(rawAnswers: unknown, categorySlug: string): Promise<{ score?: number; correct?: number; total?: number; xp?: number; attemptId?: string; error?: string }> {
  const auth = await getSignedInUser();
  if ("error" in auth) return { error: auth.error };
  const parsed = AnswerSchema.safeParse(rawAnswers);
  if (!parsed.success) return { error: "Format jawaban tidak valid." };
  const answers = parsed.data;
  const admin = createAdminClient();
  const questionIds = [...new Set(answers.map(a=>a.questionId))];
  if (questionIds.length !== answers.length) return { error: "Soal duplikat tidak diperbolehkan." };
  const { data: questions, error: questionError } = await admin.from("questions").select("id, question_options(id, is_correct)").in("id", questionIds).eq("published", true);
  if (questionError || !questions || questions.length !== answers.length) return { error: "Sebagian soal tidak lagi tersedia. Mulai sesi baru." };
  const questionMap = new Map<string, any[]>((questions as any[]).map((q: any): [string, any[]] => [q.id, q.question_options || []]));
  let correct = 0;
  const persisted = answers.map(answer=>{
    const options:any[] = questionMap.get(answer.questionId) || [];
    const selected = options.find(o=>o.id===answer.optionId);
    const isCorrect = !!selected?.is_correct;
    if (isCorrect) correct++;
    return {question_id:answer.questionId, selected_option_id:selected?answer.optionId:null, is_correct:isCorrect};
  });
  const total = answers.length;
  const score = Math.round((correct/total)*100);
  const xp = correct*10;
  const { data: attempt, error: attemptError } = await admin.from("quiz_attempts").insert({
    user_id:auth.user.id, category_slug:categorySlug||"all", score, total_questions:total, correct_answers:correct, xp_earned:xp
  }).select("id").single();
  if (attemptError || !attempt) return { error: "Hasil belum dapat disimpan. Coba lagi." };
  const { error: answerError } = await admin.from("quiz_answers").insert(persisted.map(a=>({...a,attempt_id:attempt.id})));
  if (answerError) return { error: "Nilai tersimpan, tetapi rincian jawaban belum tersimpan." };
  revalidatePath("/dashboard");
  revalidatePath("/latihan");
  return { score, correct, total, xp, attemptId:attempt.id };
}

export async function markMaterialComplete(materialId: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await getSignedInUser();
  if ("error" in auth) return { error: auth.error };
  if (!z.string().uuid().safeParse(materialId).success) return { error: "Materi tidak valid." };
  const { error } = await auth.supabase.from("user_progress").upsert({user_id:auth.user.id,material_id:materialId},{onConflict:"user_id,material_id"});
  if (error) return { error: "Progres belum dapat disimpan. Coba lagi." };
  revalidatePath("/dashboard");
  revalidatePath("/materi");
  return { success:true };
}

const MaterialSchema = z.object({
  title:z.string().trim().min(3).max(120),
  slug:z.string().trim().min(3).max(140).regex(/^[a-z0-9-]+$/),
  categoryId:z.string().uuid(),
  arabic:z.string().trim().min(1).max(300),
  summary:z.string().trim().min(5).max(500),
  content:z.string().trim().min(10).max(10000),
  level:z.coerce.number().int().min(1).max(3),
  minutes:z.coerce.number().int().min(1).max(180),
  published:z.enum(["on"]).optional()
});

export async function createMaterial(formData: FormData) {
  const auth = await getSignedInUser();
  if ("error" in auth) redirect("/login");
  if (!(await isStaff(auth.user.id))) redirect("/dashboard");
  const parsed = MaterialSchema.safeParse({
    title:formData.get("title"),slug:formData.get("slug"),categoryId:formData.get("categoryId"),
    arabic:formData.get("arabic"),summary:formData.get("summary"),content:formData.get("content"),
    level:formData.get("level"),minutes:formData.get("minutes"),published:formData.get("published")||undefined
  });
  if (!parsed.success) redirect("/admin?error=invalid");
  const admin = createAdminClient();
  const { error } = await admin.from("materials").insert({
    title:parsed.data.title,slug:parsed.data.slug,category_id:parsed.data.categoryId,arabic:parsed.data.arabic,
    summary:parsed.data.summary,content:parsed.data.content,level:parsed.data.level,minutes:parsed.data.minutes,
    published:!!parsed.data.published,created_by:auth.user.id
  });
  if (error) redirect("/admin?error=save");
  revalidatePath("/materi");
  revalidatePath("/admin");
  redirect("/admin?success=created");
}
