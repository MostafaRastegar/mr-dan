import type { ReactNode } from "react";

import { TEST_IDS } from "@/constants/test-ids";

interface FreeTimeCardViewProps {
  freeMinutes: number;
  breakdown: {
    wakingMinutes: number;
    schoolMinutes: number;
    otherOccupiedMinutes: number;
    homeworkAverageMinutes: number;
  };
  demo: "success" | "empty" | "loading" | "error";
}

const persianDigits = new Intl.NumberFormat("fa-IR", { useGrouping: false });

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0 && rest === 0) return "۰ دقیقه";
  if (rest === 0) return `${persianDigits.format(hours)} ساعت`;
  if (hours === 0) return `${persianDigits.format(rest)} دقیقه`;
  return `${persianDigits.format(hours)} ساعت و ${persianDigits.format(rest)} دقیقه`;
}

export function FreeTimeCardView(props: FreeTimeCardViewProps): ReactNode {
  const { freeMinutes, breakdown, demo } = props;

  if (demo === "loading") {
    return (
      <section
        className="rounded-xl border border-slate-200 bg-white p-5"
        data-testid={TEST_IDS.DASHBOARD.CARD("free-time")}
      >
        بارگذاری…
      </section>
    );
  }

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-5"
      data-testid={TEST_IDS.DASHBOARD.CARD("free-time")}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">وقت آزاد امروز</span>
        <span
          className="text-xl font-bold text-slate-900"
          dir="ltr"
          data-testid={TEST_IDS.DASHBOARD.FREE_MINUTES}
        >
          {formatDuration(freeMinutes)}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500" dir="ltr">
        بیداری {formatDuration(breakdown.wakingMinutes)} −
        مدرسه {formatDuration(breakdown.schoolMinutes)} (از برنامهٔ مدرسه) −
        اشغال {formatDuration(breakdown.otherOccupiedMinutes)} −
        تکلیف {formatDuration(breakdown.homeworkAverageMinutes)}
      </p>
    </section>
  );
}
