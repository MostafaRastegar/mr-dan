/**
 * Read wrapper for the admin tables: a failed read renders the page's error
 * state instead of the error boundary, and never leaks the provider error.
 */

import type { Page } from "@/modules/advising/domain/models";

export type AdminSearchParams = Promise<{
  page?: string;
  pageSize?: string;
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
