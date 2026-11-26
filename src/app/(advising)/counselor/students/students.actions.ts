"use server";

import {
  assignStudentSchema,
  makeRegisterSchemas,
} from "@/modules/advising/presentation/schemas";
import { runAction } from "@/utils/server-action";
import { formValues } from "@/utils/form-data";
import type { ActionState } from "@/utils/app-error";
import { requireSessionUser } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

export async function createGroupAction(
  _previous: ActionState<{ groupId: string }> | null,
  formData: FormData,
): Promise<ActionState<{ groupId: string }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const { fields, grades } =
      await getContainer().advising.catalogOptions.execute();
    const { createGroupSchema } = makeRegisterSchemas({
      fields: fields.map((row) => row.label),
      grades: grades.map((row) => row.label),
    });
    const input = createGroupSchema.parse(formValues(formData));
    const group = await getContainer().advising.createGroup.execute({
      actor: { id: user.id, role: user.role },
      ...input,
    });
    return { groupId: group.id };
  });
}

export async function assignStudentAction(
  _previous: ActionState<{ studentId: string }> | null,
  formData: FormData,
): Promise<ActionState<{ studentId: string }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const input = assignStudentSchema.parse(formValues(formData));
    await getContainer().advising.assignStudent.execute({
      actor: { id: user.id, role: user.role },
      ...input,
    });
    return { studentId: input.studentId };
  });
}
