import Link from "next/link";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-3 ${light ? "text-white" : "text-ink"}`}>
      <span className={`grid h-11 w-11 place-items-center rounded-2xl font-arabic text-3xl shadow-sm ${light ? "bg-white text-emerald-700" : "bg-emerald-600 text-white"}`}>ع</span>
      <span className="leading-tight">
        <span className="block text-lg font-extrabold tracking-tight">ArabEasy</span>
        <span className={`arabic block text-sm ${light ? "text-emerald-100" : "text-emerald-700"}`} dir="rtl">منصة تعلم اللغة العربية</span>
      </span>
    </Link>
  );
}
