"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { markMaterialComplete } from "@/app/actions";

export function MarkCompleteButton({ materialId, initiallyCompleted }: { materialId: string; initiallyCompleted: boolean }) {
  const [done, setDone] = useState(initiallyCompleted);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function complete() {
    if (done || busy) return;
    setBusy(true); setError("");
    const result = await markMaterialComplete(materialId);
    setBusy(false);
    if (result.error) setError(result.error);
    else setDone(true);
  }

  return <div><button onClick={complete} disabled={done||busy} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-xs font-bold text-white disabled:cursor-default disabled:bg-emerald-100 disabled:text-emerald-800">{busy?<LoaderCircle className="animate-spin" size={15}/>:<CheckCircle2 size={15}/>} {done?"Materi selesai":"Tandai selesai"}</button>{error&&<p className="mt-2 text-xs text-red-600">{error}</p>}</div>;
}
