import type { ServerFormAction } from "@/utils/use-form-action";

export type CatalogFieldKind = "text" | "number" | "select" | "multiselect";

export interface CatalogOption {
  value: string;
  label: string;
}

export interface CatalogFieldSpec {
  name: string;
  label: string;
  kind: CatalogFieldKind;
  options?: CatalogOption[];
  required?: boolean;
}

export interface CatalogColumnSpec {
  key: string;
  label: string;
}

export interface CatalogRow {
  id: string;
  active: boolean;
}

export interface CatalogActions {
  create: ServerFormAction<{ id: string }>;
  update: ServerFormAction<{ id: string }>;
  retire: ServerFormAction<{ id: string }>;
  reactivate: ServerFormAction<{ id: string }>;
}

export interface CatalogConfig {
  title: string;
  tableTestId: string;
  createTestId: string;
  fields: CatalogFieldSpec[];
  columns: CatalogColumnSpec[];
}
