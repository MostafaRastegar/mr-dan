import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-6">
      <h1 className="text-3xl font-bold">mr-dan</h1>
      <p className="text-slate-600">
        زیرساخت پلتفرم مشاورهٔ تحصیلی هوشمند.
      </p>
      <div className="flex gap-3 justify-center">
        <Link href="/chat" className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition">
          چت هوشمند
        </Link>
        <Link href="/admin/knowledge" className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 transition">
          پنل دانش
        </Link>
      </div>
    </main>
  );
}
