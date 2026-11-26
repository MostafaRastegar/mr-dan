import Link from "next/link";

import { getContainer } from "@/server/container";
import { requireCapability } from "@/server/advising-guards";
import { TEST_IDS } from "@/constants/test-ids";

export const metadata = { title: "فراغت — mr-dan" };

export default async function LeisurePage() {
  const { user } = await requireCapability("leisure:read");
  const { suggestion, book } = await getContainer().advising.getLeisureSuggestion.execute({
    actor: { id: user.id, role: user.role },
    fieldOfStudy: user.fieldOfStudy,
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">فراغت و کتاب</h1>

      <section className="rounded-xl border border-slate-200 bg-white p-5" data-testid={TEST_IDS.LEISURE.PANEL}>
        <h2 className="text-lg font-semibold">{suggestion.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{suggestion.reason}</p>
        <ul className="mt-3 list-inside list-disc text-sm text-slate-700">
          {suggestion.actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </section>
      <Link href="/budget" className="text-sm text-teal-700">برنامه‌ریزی وقت آزاد</Link>
      <section className="rounded-xl border border-slate-200 bg-white p-5" data-testid={TEST_IDS.LEISURE.BOOK}>
        <h2 className="text-lg font-semibold">پیشنهاد کتاب</h2>
        <p className="mt-2 text-sm">{book?.title ?? "—"}</p>
        <p className="text-xs text-slate-500">{book?.author ?? ""}</p>
      </section>
    </div>
  );
}
