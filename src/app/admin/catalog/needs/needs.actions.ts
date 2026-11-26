"use server";

import {
  adminIdSchema,
  adminLabelCreateSchema,
  adminLabelUpdateSchema,
} from "@/modules/advising/presentation/admin-schemas";
import { getContainer } from "@/server/container";
import { formValues } from "@/utils/form-data";

import { runCatalogAction, type CatalogActionResult } from "../_action-kit";

export async function createNeedAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminLabelCreateSchema.parse(formValues(data)),
    (input) => getContainer().advising.admin.needs.create(input),
  );
}

export async function updateNeedAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminLabelUpdateSchema.parse(formValues(data)),
    (input) => getContainer().advising.admin.needs.update(input),
  );
}

export async function retireNeedAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminIdSchema.parse(formValues(data)),
    async ({ id }) => {
      await getContainer().advising.admin.needs.retire(id);
      return { id };
    },
  );
}

export async function reactivateNeedAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminIdSchema.parse(formValues(data)),
    async ({ id }) => {
      await getContainer().advising.admin.needs.reactivate(id);
      return { id };
    },
  );
}
