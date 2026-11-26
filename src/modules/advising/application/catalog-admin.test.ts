import { beforeEach, describe, expect, it } from "vitest";

import {
  ManageBooksUseCase,
  ManageLabelCatalogUseCase,
  ManageSubjectsUseCase,
} from "@/modules/advising/application/catalog-admin";
import {
  createCatalogAdminFakes,
  type CatalogAdminFakes,
} from "../../../../test/fakes/catalog-admin";

let fakes: CatalogAdminFakes;

beforeEach(() => {
  fakes = createCatalogAdminFakes();
});

function subjects(): ManageSubjectsUseCase {
  return new ManageSubjectsUseCase(fakes.admin);
}

describe("catalog admin", () => {
  it("rejects a duplicate subject slug with slug_conflict", async () => {
    await subjects().create({
      slug: "riazi",
      label: "ریاضی",
      fieldLabels: [],
      gradeLabels: [],
    });

    await expect(
      subjects().create({
        slug: "riazi",
        label: "ریاضی دیگر",
        fieldLabels: [],
        gradeLabels: [],
      }),
    ).rejects.toMatchObject({ code: "slug_conflict" });
  });

  it("rejects a duplicate book slug with slug_conflict", async () => {
    const books = new ManageBooksUseCase(fakes.admin);
    await books.create({
      slug: "deep-work",
      title: "کار عمیق",
      author: "کال نیوپورت",
      fieldLabel: null,
      codes: ["heavy_workload"],
    });

    await expect(
      books.create({
        slug: "deep-work",
        title: "تکراری",
        author: "نویسنده",
        fieldLabel: null,
        codes: [],
      }),
    ).rejects.toMatchObject({ code: "slug_conflict" });
  });

  it("trims and validates required text", async () => {
    await expect(
      subjects().create({
        slug: "  ",
        label: "ریاضی",
        fieldLabels: [],
        gradeLabels: [],
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });

    const created = await subjects().create({
      slug: "  fizik  ",
      label: "  فیزیک  ",
      fieldLabels: [" علوم تجربی ", ""],
      gradeLabels: [],
    });
    const page = await subjects().list();
    const row = page.items.find((item) => item.id === created.id);
    expect(row?.slug).toBe("fizik");
    expect(row?.label).toBe("فیزیک");
    expect(row?.fieldLabels).toEqual(["علوم تجربی"]);
  });

  it("retire removes the row from the active option list and keeps it in the admin list", async () => {
    const created = await subjects().create({
      slug: "honar",
      label: "هنر",
      fieldLabels: ["هنر"],
      gradeLabels: [],
    });

    await subjects().retire(created.id);

    const adminPage = await subjects().list();
    expect(adminPage.items.find((item) => item.id === created.id)?.active).toBe(
      false,
    );

    const active = await fakes.reader.listSubjects();
    expect(active.some((item) => item.id === created.id)).toBe(false);
  });

  it("reactivate returns the row to the active option list", async () => {
    const created = await subjects().create({
      slug: "honar",
      label: "هنر",
      fieldLabels: [],
      gradeLabels: [],
    });

    await subjects().retire(created.id);
    await subjects().reactivate(created.id);

    const active = await fakes.reader.listSubjects();
    expect(active.some((item) => item.id === created.id)).toBe(true);
  });

  it("pagination returns one slice with the real total", async () => {
    for (let index = 0; index < 25; index += 1) {
      await subjects().create({
        slug: `subject-${index}`,
        label: `درس ${index}`,
        fieldLabels: [],
        gradeLabels: [],
      });
    }

    const page = await subjects().list({ page: 2, pageSize: 10 });

    expect(page.page).toBe(2);
    expect(page.pageSize).toBe(10);
    expect(page.total).toBe(25);
    expect(page.items).toHaveLength(10);
    expect(fakes.admin.lastQuery).toEqual({ page: 2, pageSize: 10 });
  });

  it("needs derive the code from the label and keep it when the label changes", async () => {
    const needs = new ManageLabelCatalogUseCase(fakes.admin, "needs");

    const created = await needs.create({ label: "انگیزه" });
    const first = await fakes.admin.listNeeds({ page: 1, pageSize: 20 });
    expect(first.items.find((item) => item.id === created.id)?.code).toBe(
      "انگیزه",
    );

    await needs.update({ id: created.id, label: "انگیزه تحصیلی" });

    const page = await fakes.admin.listNeeds({ page: 1, pageSize: 20 });
    const row = page.items.find((item) => item.id === created.id);
    expect(row?.label).toBe("انگیزه تحصیلی");
    expect(row?.code).toBe("انگیزه");

    const explicit = await needs.create({
      label: "آمادگی",
      code: "readiness",
    });
    const flagged = await fakes.admin.listNeeds({ page: 1, pageSize: 20 });
    expect(flagged.items.find((item) => item.id === explicit.id)?.code).toBe(
      "readiness",
    );

    await expect(needs.create({ label: "انگیزه" })).rejects.toMatchObject({
      code: "slug_conflict",
    });
  });

  it("grade labels persist on update and removing them keeps the subject", async () => {
    const created = await subjects().create({
      slug: "fizik",
      label: "فیزیک",
      fieldLabels: ["ریاضی فیزیک"],
      gradeLabels: ["دهم"],
    });

    const assigned = await subjects().list();
    expect(
      assigned.items.find((item) => item.id === created.id)?.gradeLabels,
    ).toEqual(["دهم"]);

    await subjects().update({
      id: created.id,
      slug: "fizik",
      label: "فیزیک",
      fieldLabels: ["ریاضی فیزیک"],
      gradeLabels: [],
    });

    const cleared = await subjects().list();
    expect(cleared.items).toHaveLength(1);
    expect(
      cleared.items.find((item) => item.id === created.id)?.gradeLabels,
    ).toEqual([]);

    const active = await fakes.reader.listSubjects();
    expect(active.some((item) => item.id === created.id)).toBe(true);
  });
});
