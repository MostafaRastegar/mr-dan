import { describe, expect, it } from "vitest";

import {
  isSubjectSlug,
  subjectLabel,
  subjectsForField,
  SUBJECTS,
  SUBJECT_SLUGS,
} from "./subjects";

describe("subject catalog completeness", () => {
  it("catalog completeness", () => {
    const slugs = new Set(SUBJECT_SLUGS);
    expect(slugs.size).toBe(SUBJECT_SLUGS.length); // no duplicates

    for (const slug of SUBJECT_SLUGS) {
      expect(SUBJECTS[slug]).toBeDefined();
      expect(typeof SUBJECTS[slug].label).toBe("string");
      expect(SUBJECTS[slug].label.length).toBeGreaterThan(0);
      expect(Array.isArray(SUBJECTS[slug].fields)).toBe(true);
    }
  });

  it("catalog labels", () => {
    expect(subjectLabel("quran")).toBe("قرآن");
    expect(subjectLabel("fizik")).toBe("فیزیک");
    expect(subjectLabel("zist")).toBe("زیست‌شناسی");
    expect(subjectLabel("rayane")).toBe("شبکه و نرم‌افزار رایانه");

    // unknown string echoed unchanged (render never throws)
    expect(subjectLabel("math")).toBe("math");
    expect(subjectLabel("")).toBe("");

    // isSubjectSlug accepts each slug and rejects unknowns
    for (const slug of SUBJECT_SLUGS) {
      expect(isSubjectSlug(slug)).toBe(true);
    }
    expect(isSubjectSlug("math")).toBe(false);
    expect(isSubjectSlug("")).toBe(false);

    // subjectsForField: null returns only عمومی; "علوم تجربی" includes zist/fizik/shimi, excludes hesaban
    const general = subjectsForField(null);
    expect(general.every(({ slug }) => SUBJECTS[slug].fields.length === 0)).toBe(
      true,
    );

    const experimental = subjectsForField("علوم تجربی");
    const experimentalSlugs = experimental.map(({ slug }) => slug);
    expect(experimentalSlugs).toContain("zist");
    expect(experimentalSlugs).toContain("fizik");
    expect(experimentalSlugs).toContain("shimi");
    expect(experimentalSlugs).not.toContain("hesaban");
    // generality first, then own subjects
    expect(SUBJECTS[experimental[0].slug].fields.length).toBe(0);
  });
});
