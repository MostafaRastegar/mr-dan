import type { ReactNode } from "react";
import { Button, Empty, InputNumber } from "antd";
import type { HomeworkItem } from "@/modules/advising/domain/models";
import { subjectLabel } from "@/modules/advising/domain/subjects";
import { formatDeadline } from "@/modules/advising/presentation/planning-format";

import { TEST_IDS } from "@/constants/test-ids";

interface HomeworkTodayViewProps {
  items: HomeworkItem[];
  tickedHomework: Map<string, number>;
  homeworkMinutes: Map<string, number>;
  onToggleHomework: (id: string) => void;
  onSetHomeworkMinutes: (id: string, minutes: number | null) => void;
  demo: "success" | "empty" | "loading" | "error";
}

function isValidMinutes(minutes: number | null | undefined): boolean {
  return typeof minutes === "number" && Number.isFinite(minutes) && minutes >= 1 && minutes <= 1440;
}

export function HomeworkTodayView(props: HomeworkTodayViewProps): ReactNode {
  const { items, tickedHomework, homeworkMinutes, onToggleHomework, onSetHomeworkMinutes, demo } = props;

  if (demo === "loading") {
    return (
      <section
        className="rounded-xl border border-slate-200 bg-white p-5"
        data-testid={TEST_IDS.DASHBOARD.CARD("homework")}
      >
        بارگذاری…
      </section>
    );
  }

  const pending = items.filter((item) => item.completedAt === null && !tickedHomework.has(item.id));
  const done = items.filter((item) => item.completedAt === null && tickedHomework.has(item.id));

  if (pending.length === 0 && done.length === 0) {
    return (
      <section
        className="rounded-xl border border-slate-200 bg-white p-5"
        data-testid={TEST_IDS.DASHBOARD.CARD("homework")}
      >
        <h2 className="mb-3 text-lg font-semibold">تکالیف امروز و فردا</h2>
        <Empty description="هیچ تکلیفی در انتظار نیست" />
      </section>
    );
  }

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-5"
      data-testid={TEST_IDS.DASHBOARD.CARD("homework")}
    >
      <h2 className="mb-3 text-lg font-semibold">تکالیف امروز و فردا</h2>
      <ul className="flex flex-col gap-2">
        {pending.map((item) => {
          const minutes = homeworkMinutes.get(item.id);
          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded border border-slate-200 p-3"
            >
              <span className="text-sm">
                {item.title} {item.subject ? `— ${subjectLabel(item.subject)}` : ""}
              </span>
              <span className="text-xs text-slate-500" dir="ltr">
                {formatDeadline(item.deadline)}
              </span>
              <div className="flex items-center gap-2">
                <InputNumber
                  min={1}
                  max={1440}
                  value={minutes ?? null}
                  onChange={(v) => onSetHomeworkMinutes(item.id, v ?? null)}
                  data-testid={TEST_IDS.DASHBOARD.HOMEWORK_MINUTES(item.id)}
                  className="w-[6rem]"
                />
                <Button
                  size="small"
                  disabled={!isValidMinutes(minutes)}
                  onClick={() => onToggleHomework(item.id)}
                  data-testid={TEST_IDS.DASHBOARD.HOMEWORK_TOGGLE(item.id)}
                >
                  انجام شد
                </Button>
              </div>
            </li>
          );
        })}
        {done.map((item) => {
          const minutes = tickedHomework.get(item.id) ?? 0;
          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded border border-teal-200 bg-teal-50 p-3"
            >
              <span className="text-sm line-through">{item.title}</span>
              <span className="text-xs text-slate-500" dir="ltr" />
              <span className="text-xs text-teal-700 font-medium" dir="ltr">
                انجام شده — {minutes} دقیقه
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
