import { redirect } from "next/navigation";

import { RegisterFormWrapper } from "./register-form.vm";
import { getSessionContext } from "@/server/advising-guards";

export const metadata = { title: "ثبت‌نام — mr-dan" };

export default async function RegisterPage() {
  if (await getSessionContext()) redirect("/profile");

  return <RegisterFormWrapper />;
}
