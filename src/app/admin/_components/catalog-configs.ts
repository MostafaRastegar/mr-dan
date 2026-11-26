/**
 * Admin catalog form/table specs. Only vocabulary lives here: labels, input
 * kinds and the option lists built from the runtime catalog rows. Rows are
 * always fetched from the DB.
 */

import { TEST_IDS } from "@/constants/test-ids";
import { LEISURE_CODES } from "@/modules/advising/domain/leisure";
import type { CatalogOptions } from "@/modules/advising/application/catalog-options";
import { getContainer } from "@/server/container";

import type { CatalogConfig, CatalogOption } from "./catalog-types";

function fieldOptions(catalog: CatalogOptions): CatalogOption[] {
  return catalog.fields.map((row) => ({ value: row.label, label: row.label }));
}

function gradeOptions(catalog: CatalogOptions): CatalogOption[] {
  return catalog.grades.map((row) => ({ value: row.label, label: row.label }));
}

function subjectOptions(catalog: CatalogOptions): CatalogOption[] {
  return catalog.subjects.map((row) => ({ value: row.slug, label: row.label }));
}

const LEISURE_LABELS: Record<string, string> = {
  critical_fatigue: "خستگی شدید",
  heavy_workload: "بار کاری سنگین",
  overloaded_week: "هفتهٔ پرترافیک",
  balanced: "متعادل",
  low_activity: "تحرک کم",
};

const LEISURE_OPTIONS: CatalogOption[] = LEISURE_CODES.map((code) => ({
  value: code,
  label: LEISURE_LABELS[code] ?? code,
}));

const CATALOG_PAGE = {
  tableTestId: TEST_IDS.ADMIN.CATALOG_TABLE,
  createTestId: TEST_IDS.ADMIN.CATALOG_CREATE,
};

export const FIELD_CONFIG: CatalogConfig = {
  ...CATALOG_PAGE,
  title: "رشته‌های تحصیلی",
  columns: [{ key: "label", label: "برچسب" }],
  fields: [{ name: "label", label: "برچسب", kind: "text", required: true }],
};

export const GRADE_CONFIG: CatalogConfig = {
  ...CATALOG_PAGE,
  title: "پایه‌های تحصیلی",
  columns: [{ key: "label", label: "برچسب" }],
  fields: [{ name: "label", label: "برچسب", kind: "text", required: true }],
};

async function catalogOptions(): Promise<CatalogOptions> {
  return getContainer().advising.catalogOptions.execute();
}

export async function subjectConfig(): Promise<CatalogConfig> {
  const catalog = await catalogOptions();
  return {
    ...CATALOG_PAGE,
    title: "دروس",
    columns: [
      { key: "label", label: "برچسب" },
      { key: "slug", label: "نامک" },
      { key: "fieldLabels", label: "رشته‌ها" },
      { key: "gradeLabels", label: "پایه‌ها" },
    ],
    fields: [
      { name: "label", label: "برچسب", kind: "text", required: true },
      { name: "slug", label: "نامک", kind: "text", required: true },
      {
        name: "fieldLabels",
        label: "رشته‌ها",
        kind: "multiselect",
        options: fieldOptions(catalog),
      },
      {
        name: "gradeLabels",
        label: "پایه‌ها",
        kind: "multiselect",
        options: gradeOptions(catalog),
      },
    ],
  };
}

export async function bookConfig(): Promise<CatalogConfig> {
  const catalog = await catalogOptions();
  return {
    ...CATALOG_PAGE,
    title: "کتاب‌ها",
  columns: [
    { key: "title", label: "عنوان" },
    { key: "author", label: "نویسنده" },
    { key: "fieldLabel", label: "رشته" },
    { key: "codes", label: "کدهای فراغت" },
  ],
  fields: [
    { name: "title", label: "عنوان", kind: "text", required: true },
    { name: "author", label: "نویسنده", kind: "text", required: true },
    { name: "slug", label: "نامک", kind: "text", required: true },
    {
      name: "fieldLabel",
      label: "رشته",
      kind: "select",
      options: fieldOptions(catalog),
    },
    {
      name: "codes",
      label: "کدهای فراغت",
      kind: "multiselect",
      options: LEISURE_OPTIONS,
    },
  ],
  };
}

export const NEED_CONFIG: CatalogConfig = {
  ...CATALOG_PAGE,
  title: "نیازها",
  columns: [{ key: "label", label: "برچسب" }],
  fields: [{ name: "label", label: "برچسب", kind: "text", required: true }],
};

export const EXAM_CONFIG: CatalogConfig = {
  ...CATALOG_PAGE,
  title: "آزمون‌ها",
  columns: [{ key: "label", label: "برچسب" }],
  fields: [{ name: "label", label: "برچسب", kind: "text", required: true }],
};

export async function chapterConfig(): Promise<CatalogConfig> {
  const catalog = await catalogOptions();
  return {
    ...CATALOG_PAGE,
    title: "فصل‌ها",
  columns: [
    { key: "subject", label: "درس" },
    { key: "field", label: "رشته" },
    { key: "grade", label: "پایه" },
    { key: "number", label: "شماره" },
    { key: "title", label: "عنوان" },
  ],
  fields: [
    {
      name: "subject",
      label: "درس",
      kind: "select",
      options: subjectOptions(catalog),
      required: true,
    },
    {
      name: "field",
      label: "رشته",
      kind: "select",
      options: fieldOptions(catalog),
      required: true,
    },
    {
      name: "grade",
      label: "پایه",
      kind: "select",
      options: gradeOptions(catalog),
      required: true,
    },
    { name: "number", label: "شماره", kind: "number", required: true },
    { name: "title", label: "عنوان", kind: "text", required: true },
  ],
  };
}
