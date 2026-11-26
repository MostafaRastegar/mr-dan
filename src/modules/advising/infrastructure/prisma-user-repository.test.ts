import { describe, expect, it } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import { PrismaUserRepository } from "./prisma-user-repository";

function repoWithExplodingClient(): PrismaUserRepository {
  const explode = () => {
    throw new Error("Prisma must not be called with an empty id");
  };
  const client = {
    user: {
      findUnique: explode,
      findMany: explode,
      update: explode,
      create: explode,
    },
  } as unknown as PrismaClient;
  return new PrismaUserRepository(client);
}

describe("PrismaUserRepository empty ids", () => {
  it('findById("") resolves null without touching Prisma', async () => {
    await expect(repoWithExplodingClient().findById("")).resolves.toBeNull();
  });

  it('findProfileById("") resolves null without touching Prisma', async () => {
    await expect(
      repoWithExplodingClient().findProfileById(""),
    ).resolves.toBeNull();
  });
});
