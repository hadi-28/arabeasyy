import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-slate-500">Memuat formulir pendaftaran…</div>}><AuthForm mode="register"/></Suspense>;
}
