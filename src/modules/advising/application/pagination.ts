/**
 * Server-side pagination clamp shared by admin lists.
 *
 * Page is 1-based; pageSize defaults to 20 and never exceeds 100. Out-of-range
 * pages are valid: the adapter returns an empty slice with the real total.
 */

import type { PageQuery } from "../domain/ports";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function clampPage(input?: {
  page?: number;
  pageSize?: number;
}): PageQuery {
  const page =
    Number.isInteger(input?.page) && (input?.page ?? 0) > 0
      ? (input?.page as number)
      : 1;
  const rawSize =
    Number.isInteger(input?.pageSize) && (input?.pageSize ?? 0) > 0
      ? (input?.pageSize as number)
      : DEFAULT_PAGE_SIZE;
  return { page, pageSize: Math.min(rawSize, MAX_PAGE_SIZE) };
}
