import Link from "next/link";
import { redirect } from "next/navigation";

import LoginForm from "@/components/auth/login-form";
import { getSessionContext } from "@/server/advising-guards";

export const metadata = { title: "ورود — mr-dan" };

export default async function LoginPage() {
  if (await getSessionContext()) redirect("/profile");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-bold">ورود به mr-dan</h1>
      <LoginForm />
      <Link href="/" className="text-center text-sm text-slate-600 underline">
        بازگشت به صفحهٔ اصلی
      </Link>
    </main>
  );
}
