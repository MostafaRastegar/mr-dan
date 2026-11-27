import { describe, expect, it } from "vitest";

import { FakeSchoolProgramRepository } from "../../../../test/fakes/advisor-program";
import { FakeUserRepository } from "../../../../test/fakes/advising";
import {
  AddSchoolProgramEntryUseCase,
  ListSchoolProgramUseCase,
} from "@/modules/advising/application/school-program";
import type { Actor } from "@/modules/advising/application/planning-access";

const actor: Actor = { id: "s1", role: "student" };

function makeUsers() {
  return new FakeUserRepository({ groupNames: new Map(), groupCounts: new Map() });
}

async function seedUser(users: FakeUserRepository, id: string, role: "student" | "counselor" = "student") {
  await users.create({
    id,
    username: id,
    email: null,
    role,
    fullName: id,
    grade: "دهم",
    fieldOfStudy: "ریاضی فیزیک",
    schoolName: null,
    groupId: null,
    counselorId: null,
    passwordHash: "x",
  });
}

describe("AddSchoolProgramEntryUseCase", () => {
  it("AC-18: school program duplicate (duplicate day+subject → one row, Persian conflict)", async () => {
    const users = makeUsers();
    await seedUser(users, actor.id);
    const program = new FakeSchoolProgramRepository();
    const add = new AddSchoolProgramEntryUseCase(users, program);

    await add.execute({ actor, dayOfWeek: 1, subject: "riazi", hours: 3 });
    await expect(
      add.execute({ actor, dayOfWeek: 1, subject: "riazi", hours: 2 }),
    ).rejects.toMatchObject({ code: "conflict" });

    const rows = await program.listByStudent(actor.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].minutes).toBe(180);
  });

  it("minutes out of bounds → ValidationError", async () => {
    const users = makeUsers();
    await seedUser(users, actor.id);
    const program = new FakeSchoolProgramRepository();
    const add = new AddSchoolProgramEntryUseCase(users, program);

    await expect(
      add.execute({ actor, dayOfWeek: 1, subject: "riazi", hours: 0.1 }),
    ).rejects.toMatchObject({ code: "invalid_input" });
    await expect(
      add.execute({ actor, dayOfWeek: 1, subject: "riazi", hours: 13 }),
    ).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("bad dayOfWeek → ValidationError", async () => {
    const users = makeUsers();
    await seedUser(users, actor.id);
    const program = new FakeSchoolProgramRepository();
    const add = new AddSchoolProgramEntryUseCase(users, program);

    await expect(
      add.execute({ actor, dayOfWeek: 7, subject: "riazi", hours: 3 }),
    ).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("AC-26: round-trip — save then list returns the same row", async () => {
    const users = makeUsers();
    await seedUser(users, actor.id);
    const program = new FakeSchoolProgramRepository();
    const add = new AddSchoolProgramEntryUseCase(users, program);
    const list = new ListSchoolProgramUseCase(users, program);

    const created = await add.execute({ actor, dayOfWeek: 1, subject: "riazi", hours: 3 });
    expect(created.minutes).toBe(180);

    const rows = await list.execute({ actor });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(created.id);
    expect(rows[0].subject).toBe("riazi");
    expect(rows[0].dayOfWeek).toBe(1);
    expect(rows[0].minutes).toBe(180);
  });

  it("another student's row is not visible", async () => {
    const users = makeUsers();
    await seedUser(users, actor.id, "student");
    await seedUser(users, "s2", "student");
    const program = new FakeSchoolProgramRepository();
    const add = new AddSchoolProgramEntryUseCase(users, program);
    const list = new ListSchoolProgramUseCase(users, program);

    await add.execute({ actor, dayOfWeek: 1, subject: "riazi", hours: 3 });

    const other = { id: "s2", role: "student" as const };
    const rows = await list.execute({ actor: other });
    expect(rows).toEqual([]);
  });
});

describe("school program is a student self-feature", () => {
  it("AC-7: counselor and admin writes are forbidden", async () => {
    const users = makeUsers();
    await seedUser(users, actor.id, "student");
    await seedUser(users, "c1", "counselor");
    const program = new FakeSchoolProgramRepository();
    const add = new AddSchoolProgramEntryUseCase(users, program);

    for (const role of ["counselor", "admin"] as const) {
      await expect(
        add.execute({
          actor: { id: role === "counselor" ? "c1" : "a1", role },
          dayOfWeek: 1,
          subject: "riazi",
          hours: 3,
        }),
      ).rejects.toMatchObject({ code: "forbidden" });
    }
    expect(await program.listByStudent(actor.id)).toEqual([]);
  });
});
