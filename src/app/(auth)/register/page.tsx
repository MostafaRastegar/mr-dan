import { redirect } from "next/navigation";

import { RegisterFormWrapper } from "./register-form.vm";
import { getSessionContext } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

export const metadata = { title: "ثبت‌نام — mr-dan" };

export default async function RegisterPage() {
  if (await getSessionContext()) redirect("/profile");

  const { fields, grades } =
    await getContainer().advising.catalogOptions.execute();

  return (
    <RegisterFormWrapper
      fieldOptions={fields.map((row) => row.label)}
      gradeOptions={grades.map((row) => row.label)}
    />
  );
}
