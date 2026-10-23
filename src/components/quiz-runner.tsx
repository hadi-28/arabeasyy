"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, CircleHelp, LoaderCircle, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { checkQuizAnswer, finishQuiz, startQuiz, type PublicQuizQuestion } from "@/app/actions";

type Picked = {questionId:string;optionId:string};
type Feedback = {correct:boolean;explanation:string;correctOptionId?:string};

export function QuizRunner() {
  const [category,setCategory] = useState("all");
  const [level,setLevel] = useState("all");
  const [questions,setQuestions] = useState<PublicQuizQuestion[]>([]);
  const [index,setIndex] = useState(0);
  const [picked,setPicked] = useState<Picked[]>([]);
  const [feedback,setFeedback] = useState<Record<string,Feedback>>({});
  const [selected,setSelected] = useState<string|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [result,setResult] = useState<{score:number;correct:number;total:number;xp:number;wrong:{prompt:string;correctAnswer:string;explanation:string;arabic:string|null}[]}|null>(null);
  const [started,setStarted] = useState(false);

  async function begin() {
    setBusy(true);setError("");setResult(null);setFeedback({});setPicked([]);setSelected(null);setIndex(0);
    const res=await startQuiz(category,level==="all"?null:Number(level));
    setBusy(false);
    if(res.error||!res.questions?.length){setError(res.error||"Soal belum tersedia.");return;}
    setQuestions(res.questions);setStarted(true);
  }

  async function choose(optionId:string) {
    if(selected||busy)return;
    setSelected(optionId);setBusy(true);setError("");
    const q=questions[index];
    const res=await checkQuizAnswer(q.id,optionId);
    setBusy(false);
    if(res.error){setSelected(null);setError(res.error);return;}
    setFeedback(prev=>({...prev,[q.id]:{correct:!!res.correct,explanation:res.explanation||"",correctOptionId:res.correctOptionId}}));
    setPicked(prev=>[...prev.filter(a=>a.questionId!==q.id),{questionId:q.id,optionId}]);
  }

  async function next() {
    if(index<questions.length-1){setIndex(i=>i+1);setSelected(null);return;}
    setBusy(true);setError("");
    const res=await finishQuiz(picked,category);
    setBusy(false);
    if(res.error){setError(res.error);return;}
    const wrong = questions.flatMap((question) => {
      const answer = picked.find((item) => item.questionId === question.id);
      const fb = feedback[question.id];
      if (!answer || fb?.correct) return [];
      const correctAnswer = question.options.find((option) => option.id === fb?.correctOptionId)?.label || "Tidak tersedia";
      return [{prompt:question.prompt, correctAnswer, explanation:fb?.explanation || "", arabic:question.prompt_arabic}];
    });
    setResult({score:res.score||0,correct:res.correct||0,total:res.total||picked.length,xp:res.xp||0,wrong});
    setStarted(false);
  }

  function reset(){setStarted(false);setQuestions([]);setIndex(0);setPicked([]);setFeedback({});setSelected(null);setResult(null);setError("");}

  if(result) return <section className="rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm sm:p-10"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Sparkles size={27}/></span><p className="mt-5 text-[10px] font-bold tracking-[.18em] text-emerald-700">SESI SELESAI</p><h2 className="mt-2 text-3xl font-extrabold">{result.score>=80?"Luar biasa!":result.score>=60?"Kerja bagus!":"Terus berlatih!"}</h2><p className="mt-2 text-sm text-slate-500">Hasil latihanmu berhasil disimpan ke akun.</p><div className="mx-auto mt-7 grid max-w-xl grid-cols-3 gap-3"><div className="rounded-2xl bg-emerald-50 p-4"><b className="block text-3xl font-extrabold text-emerald-800">{result.score}</b><small className="text-[10px] text-emerald-700">Nilai / 100</small></div><div className="rounded-2xl bg-blue-50 p-4"><b className="block text-3xl font-extrabold text-blue-800">{result.correct}/{result.total}</b><small className="text-[10px] text-blue-700">Jawaban benar</small></div><div className="rounded-2xl bg-amber-50 p-4"><b className="block text-3xl font-extrabold text-amber-800">{result.xp}</b><small className="text-[10px] text-amber-700">XP diperoleh</small></div></div><p className="mt-5 text-xs text-slate-500">Rumus nilai: jawaban benar ÷ total soal × 100.</p>{result.wrong.length>0&&<div className="mx-auto mt-7 max-w-2xl text-left"><h3 className="text-sm font-extrabold">Tinjau jawaban yang salah</h3><div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-100">{result.wrong.map((item,i)=><div key={`${item.prompt}-${i}`} className="p-4"><p className="text-xs font-bold">{item.prompt}</p>{item.arabic&&<p className="arabic mt-1 text-lg text-emerald-700" dir="rtl">{item.arabic}</p>}<p className="mt-2 text-xs text-emerald-800">Jawaban benar: <b>{item.correctAnswer}</b></p><p className="mt-1 text-xs leading-5 text-slate-500">{item.explanation}</p></div>)}</div></div>}<button onClick={reset} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-xs font-bold text-white"><RotateCcw size={15}/> Mulai sesi baru</button></section>;

  if(!started) return <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-start gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><CircleHelp size={23}/></span><div><h2 className="text-lg font-extrabold">Atur sesi latihan</h2><p className="mt-1 text-xs leading-5 text-slate-500">Pilih kategori dan level. Jawaban diperiksa oleh server, dan hasil disimpan ke akunmu.</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-slate-700">Kategori<select value={category} onChange={e=>setCategory(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-normal"><option value="all">Semua kategori</option><option value="mufradat">Mufradat</option><option value="nahwu">Nahwu</option><option value="sharaf">Sharaf</option><option value="hiwar">Hiwar</option></select></label><label className="text-xs font-bold text-slate-700">Tingkat kesulitan<select value={level} onChange={e=>setLevel(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-normal"><option value="all">Semua level</option><option value="1">Level 1 · Mubtadi'</option><option value="2">Level 2 · Mutawassith</option><option value="3">Level 3 · Mutaqaddim</option></select></label></div><div className="mt-5 flex flex-col justify-between gap-4 rounded-2xl bg-emerald-50/70 p-4 sm:flex-row sm:items-center"><div><b className="block text-xs">Sesi 10 soal</b><small className="mt-1 block text-[10px] text-slate-500">10 XP per jawaban benar · pembahasan langsung</small></div><button disabled={busy} onClick={begin} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-xs font-bold text-white disabled:opacity-60">{busy?<LoaderCircle className="animate-spin" size={15}/>:null}Mulai latihan <ArrowRight size={15}/></button></div>{error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}</section>;

  const q=questions[index];const fb=feedback[q.id];
  return <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between gap-3"><span className="text-xs text-slate-500">Soal <b className="text-emerald-800">{index+1}</b> dari {questions.length}</span><span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-800">Level {q.level}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{width:`${((index+(fb?1:0))/questions.length)*100}%`}}/></div><p className="mt-6 text-[10px] font-bold uppercase tracking-[.14em] text-emerald-700">{q.category} · {q.question_type}</p><h2 className="mt-3 text-xl font-extrabold leading-relaxed">{q.prompt}</h2>{q.prompt_arabic&&<p className="arabic mt-5 rounded-2xl bg-emerald-50/70 px-4 py-6 text-center text-4xl text-emerald-800" dir="rtl">{q.prompt_arabic}</p>}{q.hint&&<p className="mt-3 text-xs text-slate-500">{q.hint}</p>}<div className="mt-5 grid gap-3 sm:grid-cols-2">{q.options.map((o,i)=>{const isCorrect=fb?.correctOptionId===o.id;const isWrong=selected===o.id&&fb&&!fb.correct;let style="border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40";if(fb&&isCorrect)style="border-emerald-400 bg-emerald-50 text-emerald-900";else if(isWrong)style="border-red-300 bg-red-50 text-red-900";return <button key={o.id} disabled={!!selected||busy} onClick={()=>choose(o.id)} className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition disabled:cursor-default ${style}`}><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">{String.fromCharCode(65+i)}</span><span className={/[\u0600-\u06ff]/i.test(o.label)?"arabic text-lg":""} dir={/[\u0600-\u06ff]/i.test(o.label)?"rtl":"ltr"}>{o.label}</span>{fb&&isCorrect&&<CheckCircle2 className="ml-auto shrink-0 text-emerald-700" size={17}/ >}{isWrong&&<XCircle className="ml-auto shrink-0 text-red-600" size={17}/>}</button>})}</div>{busy&&<p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><LoaderCircle className="animate-spin" size={14}/>Memeriksa jawaban…</p>}{fb&&<div className={`mt-5 rounded-xl border p-4 text-xs leading-6 ${fb.correct?"border-emerald-100 bg-emerald-50 text-emerald-900":"border-rose-100 bg-rose-50 text-rose-900"}`}><b className="mb-1 block">{fb.correct?"✓ Jawaban benar!":"Belum tepat, tetap semangat!"}</b>{fb.explanation}</div>}{error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}<div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5"><button onClick={reset} className="text-xs font-bold text-slate-500 hover:text-slate-800">Akhiri sesi</button><button disabled={!fb||busy} onClick={next} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-xs font-bold text-white disabled:opacity-40">{index===questions.length-1?"Simpan hasil":"Soal berikutnya"} <ArrowRight size={15}/></button></div></section>;
}
