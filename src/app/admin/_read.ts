/**
 * Read wrapper for the admin tables: a failed read renders the page's error
 * state instead of the error boundary, and never leaks the provider error.
 */

import type { Page } from "@/modules/advising/domain/models";

export type AdminSearchParams = Promise<{
  page?: string;
  pageSize?: string;
  counselor?: string;
  role?: string;
  q?: string;
}>;

export async function readAdminPage<T>(
  read: () => Promise<Page<T>>,
): Promise<{ data: Page<T>; readFailed: boolean }> {
  try {
    return { data: await read(), readFailed: false };
  } catch {
    return {
      data: { items: [], page: 1, pageSize: 20, total: 0 },
      readFailed: true,
    };
  }
}

/** Option-list reads: empty list on failure, but the caller can surface `failed`. */
export async function readAdminOptions<T>(
  read: () => Promise<T[]>,
): Promise<{ options: T[]; failed: boolean }> {
  try {
    return { options: await read(), failed: false };
  } catch {
    return { options: [], failed: true };
  }
}
