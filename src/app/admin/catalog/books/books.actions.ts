"use server";

import {
  adminBookCreateSchema,
  adminBookUpdateSchema,
  adminIdSchema,
} from "@/modules/advising/presentation/admin-schemas";
import { getContainer } from "@/server/container";
import { formValues } from "@/utils/form-data";

import { runCatalogAction, type CatalogActionResult } from "../_action-kit";

function parseBookCreate(formData: FormData) {
  return adminBookCreateSchema.parse({
    ...formValues(formData),
    codes: formData.getAll("codes").map(String),
  });
}

function parseBookUpdate(formData: FormData) {
  return adminBookUpdateSchema.parse({
    ...formValues(formData),
    codes: formData.getAll("codes").map(String),
  });
}

export async function createBookAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(formData, parseBookCreate, (input) =>
    getContainer().advising.admin.books.create(input),
  );
}

export async function updateBookAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(formData, parseBookUpdate, (input) =>
    getContainer().advising.admin.books.update(input),
  );
}

export async function retireBookAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminIdSchema.parse(formValues(data)),
    async ({ id }) => {
      await getContainer().advising.admin.books.retire(id);
      return { id };
    },
  );
}

export async function reactivateBookAction(
  _previous: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  return runCatalogAction(
    formData,
    (data) => adminIdSchema.parse(formValues(data)),
    async ({ id }) => {
      await getContainer().advising.admin.books.reactivate(id);
      return { id };
    },
  );
}
