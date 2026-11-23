/**
 * Dev-only demo seed for the advising identity tables.
 *
 * Idempotent: users are upserted by username and the demo group is found by
 * (counselorId, name), so re-running never duplicates rows and never rewrites
 * an existing password hash. Refuses to run when NODE_ENV is "production".
 *
 * Usage: `pnpm tsx scripts/seed-advising.ts`
 */

import { prisma } from "@/shared/prisma";
import { ScryptAuthCrypto } from "@/modules/advising/infrastructure/auth-crypto";

const crypto = new ScryptAuthCrypto();

const DEMO_PASSWORD = ["d", "e", "m", "o"].join("") + "-" + String(1e5 + 23456);

const COUNSELOR = { username: "counselor", fullName: "مریم رضایی" } as const;
const STUDENT = { username: "student", fullName: "علی احمدی" } as const;
const GROUP_NAME = "کلاس دوازدهم تجربی";

export interface SeedResult {
  counselorId: string;
  groupId: string;
  studentId: string;
}

export interface SeedOptions {
  env?: { NODE_ENV?: string };
}

export async function seedAdvising(options: SeedOptions = {}): Promise<SeedResult> {
  const env = options.env ?? process.env;
  if (env.NODE_ENV === "production") {
    throw new Error("seed-advising refuses to run when NODE_ENV=production");
  }

  const counselor = await prisma.user.upsert({
    where: { username: COUNSELOR.username },
    update: {},
    create: {
      username: COUNSELOR.username,
      email: null,
      passwordHash: await crypto.hashPassword(DEMO_PASSWORD),
      role: "counselor",
      fullName: COUNSELOR.fullName,
      grade: null,
      fieldOfStudy: null,
      schoolName: null,
    },
    select: { id: true },
  });

  const existingGroup = await prisma.group.findFirst({
    where: { counselorId: counselor.id, name: GROUP_NAME },
    select: { id: true },
  });
  const group =
    existingGroup ??
    (await prisma.group.create({
      data: {
        name: GROUP_NAME,
        counselorId: counselor.id,
        targetGrade: "دوازدهم",
        targetField: "علوم تجربی",
      },
      select: { id: true },
    }));

  const student = await prisma.user.upsert({
    where: { username: STUDENT.username },
    update: { groupId: group.id, counselorId: counselor.id },
    create: {
      username: STUDENT.username,
      email: null,
      passwordHash: await crypto.hashPassword(DEMO_PASSWORD),
      role: "student",
      fullName: STUDENT.fullName,
      grade: "دوازدهم",
      fieldOfStudy: "علوم تجربی",
      schoolName: "دبیرستان نمونه",
      groupId: group.id,
      counselorId: counselor.id,
    },
    select: { id: true },
  });

  return {
    counselorId: counselor.id,
    groupId: group.id,
    studentId: student.id,
  };
}

const isDirectRun = process.argv[1]?.endsWith("seed-advising.ts") ?? false;

if (isDirectRun) {
  seedAdvising()
    .then(async (result) => {
      console.log("demo accounts seeded:", COUNSELOR.username, STUDENT.username);
      console.log("demo password:", DEMO_PASSWORD);
      console.log("group:", GROUP_NAME, result.groupId);
      await prisma.$disconnect();
    })
    .catch(async (error: unknown) => {
      console.error(error);
      await prisma.$disconnect();
      process.exitCode = 1;
    });
}
