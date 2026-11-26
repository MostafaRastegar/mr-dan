"use server";

import {
  adminIdSchema,
  adminLabelCreateSchema,
  adminLabelUpdateSchema,
} from "@/modules/advising/presentation/admin-schemas";
import { getContainer } from "@/server/container";
import { formValues } from "@/utils/form-data";

import { runCatalogAction, type CatalogActionResult } from "../_action-kit";

export async function createFieldAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminLabelCreateSchema.parse(formValues(data)),
    (input) => getContainer().advising.admin.fields.create(input),
  );
}

export async function updateFieldAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminLabelUpdateSchema.parse(formValues(data)),
    (input) => getContainer().advising.admin.fields.update(input),
  );
}

export async function retireFieldAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminIdSchema.parse(formValues(data)),
    async ({ id }) => {
      await getContainer().advising.admin.fields.retire(id);
      return { id };
    },
  );
}

export async function reactivateFieldAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminIdSchema.parse(formValues(data)),
    async ({ id }) => {
      await getContainer().advising.admin.fields.reactivate(id);
      return { id };
    },
  );
}
