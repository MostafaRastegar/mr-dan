import Link from "next/link";

export function HomeActions() {
  return (
    <>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/register"
          className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-teal-600 px-4 font-medium text-white transition-colors hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          ساخت حساب
        </Link>
        <Link
          href="/login"
          className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-teal-200 bg-white px-4 font-medium text-teal-700 transition-colors hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          ورود
        </Link>
      </div>

      <nav
        aria-label="پیوندهای دیگر"
        className="mt-10 flex flex-wrap gap-x-4 gap-y-2 text-xs"
      >
        <Link href="/chat" className="text-slate-400 hover:text-slate-600">
          چت هوشمند
        </Link>
        <Link href="/admin/knowledge" className="text-slate-400 hover:text-slate-600">
          پنل دانش
        </Link>
        <Link href="/api-docs" className="text-slate-400 hover:text-slate-600">
          اسناد API
        </Link>
      </nav>
    </>
  );
}
