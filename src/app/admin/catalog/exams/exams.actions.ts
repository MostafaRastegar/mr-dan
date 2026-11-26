"use server";

import {
  adminIdSchema,
  adminLabelCreateSchema,
  adminLabelUpdateSchema,
} from "@/modules/advising/presentation/admin-schemas";
import { getContainer } from "@/server/container";
import { formValues } from "@/utils/form-data";

import { runCatalogAction, type CatalogActionResult } from "../_action-kit";

export async function createExamAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminLabelCreateSchema.parse(formValues(data)),
    (input) => getContainer().advising.admin.exams.create(input),
  );
}

export async function updateExamAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminLabelUpdateSchema.parse(formValues(data)),
    (input) => getContainer().advising.admin.exams.update(input),
  );
}

export async function retireExamAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminIdSchema.parse(formValues(data)),
    async ({ id }) => {
      await getContainer().advising.admin.exams.retire(id);
      return { id };
    },
  );
}

export async function reactivateExamAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminIdSchema.parse(formValues(data)),
    async ({ id }) => {
      await getContainer().advising.admin.exams.reactivate(id);
      return { id };
    },
  );
}
