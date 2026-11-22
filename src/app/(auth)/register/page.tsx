import Link from "next/link";
import { redirect } from "next/navigation";

import RegisterForm from "@/components/auth/register-form";
import { getSessionContext } from "@/server/advising-guards";

export const metadata = { title: "ثبت‌نام — mr-dan" };

export default async function RegisterPage() {
  if (await getSessionContext()) redirect("/profile");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-10">
      <h1 className="text-2xl font-bold">ثبت‌نام در mr-dan</h1>
      <RegisterForm />
      <Link href="/" className="text-center text-sm text-slate-600 underline">
        بازگشت به صفحهٔ اصلی
      </Link>
    </main>
  );
}
