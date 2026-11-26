"use server";

import {
  adminChapterCreateSchema,
  adminChapterUpdateSchema,
  adminIdSchema,
} from "@/modules/advising/presentation/admin-schemas";
import { getContainer } from "@/server/container";
import { formValues } from "@/utils/form-data";

import { runCatalogAction, type CatalogActionResult } from "../_action-kit";

export async function createChapterAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminChapterCreateSchema.parse(formValues(data)),
    (input) => getContainer().advising.admin.chapters.create(input),
  );
}

export async function updateChapterAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminChapterUpdateSchema.parse(formValues(data)),
    (input) => getContainer().advising.admin.chapters.update(input),
  );
}

export async function retireChapterAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminIdSchema.parse(formValues(data)),
    async ({ id }) => {
      await getContainer().advising.admin.chapters.retire(id);
      return { id };
    },
  );
}

export async function reactivateChapterAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminIdSchema.parse(formValues(data)),
    async ({ id }) => {
      await getContainer().advising.admin.chapters.reactivate(id);
      return { id };
    },
  );
}
