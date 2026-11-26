import { describe, expect, it } from "vitest";

import { SlugConflictError } from "../domain/errors";
import { toActionError } from "./messages";

describe("admin action error mapping", () => {
  it("maps a duplicate catalog slug to a slug field error", () => {
    const error = toActionError(new SlugConflictError());

    expect(error.code).toBe("slug_conflict");
    expect(error.fieldErrors?.slug).toBe(error.message);
  });
});
