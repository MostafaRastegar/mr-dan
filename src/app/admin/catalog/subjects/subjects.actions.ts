"use server";

import {
  adminIdSchema,
  adminSubjectCreateSchema,
  adminSubjectUpdateSchema,
} from "@/modules/advising/presentation/admin-schemas";
import { getContainer } from "@/server/container";
import { formValues } from "@/utils/form-data";

import { runCatalogAction, type CatalogActionResult } from "../_action-kit";

function parseSubjectCreate(formData: FormData) {
  return adminSubjectCreateSchema.parse({
    ...formValues(formData),
    fieldLabels: formData.getAll("fieldLabels").map(String),
    gradeLabels: formData.getAll("gradeLabels").map(String),
  });
}

function parseSubjectUpdate(formData: FormData) {
  return adminSubjectUpdateSchema.parse({
    ...formValues(formData),
    fieldLabels: formData.getAll("fieldLabels").map(String),
    gradeLabels: formData.getAll("gradeLabels").map(String),
  });
}

export async function createSubjectAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(formData, parseSubjectCreate, (input) =>
    getContainer().advising.admin.subjects.create(input),
  );
}

export async function updateSubjectAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(formData, parseSubjectUpdate, (input) =>
    getContainer().advising.admin.subjects.update(input),
  );
}

export async function retireSubjectAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminIdSchema.parse(formValues(data)),
    async ({ id }) => {
      await getContainer().advising.admin.subjects.retire(id);
      return { id };
    },
  );
}

export async function reactivateSubjectAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminIdSchema.parse(formValues(data)),
    async ({ id }) => {
      await getContainer().advising.admin.subjects.reactivate(id);
      return { id };
    },
  );
}
