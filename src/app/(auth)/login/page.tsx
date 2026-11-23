import { redirect } from "next/navigation";

import { LoginFormWrapper } from "./login-form.vm";
import { getSessionContext } from "@/server/advising-guards";

export const metadata = { title: "ورود — mr-dan" };

export default async function LoginPage() {
  if (await getSessionContext()) redirect("/profile");

  return <LoginFormWrapper />;
}
