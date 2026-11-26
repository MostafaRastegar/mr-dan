"use server";

import {
  adminIdSchema,
  adminLabelCreateSchema,
  adminLabelUpdateSchema,
} from "@/modules/advising/presentation/admin-schemas";
import { getContainer } from "@/server/container";
import { formValues } from "@/utils/form-data";

import { runCatalogAction, type CatalogActionResult } from "../_action-kit";

export async function createGradeAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminLabelCreateSchema.parse(formValues(data)),
    (input) => getContainer().advising.admin.grades.create(input),
  );
}

export async function updateGradeAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminLabelUpdateSchema.parse(formValues(data)),
    (input) => getContainer().advising.admin.grades.update(input),
  );
}

export async function retireGradeAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminIdSchema.parse(formValues(data)),
    async ({ id }) => {
      await getContainer().advising.admin.grades.retire(id);
      return { id };
    },
  );
}

export async function reactivateGradeAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminIdSchema.parse(formValues(data)),
    async ({ id }) => {
      await getContainer().advising.admin.grades.reactivate(id);
      return { id };
    },
  );
}
