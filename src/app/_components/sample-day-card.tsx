import { IconCheck, IconClock } from "@tabler/icons-react";

type DayRow = {
  label: string;
  meta: string;
  done: boolean;
  sun?: boolean;
};

const dayRows: DayRow[] = [
  { label: "تکلیف ریاضی", meta: "۴۵ دقیقه", done: true },
  { label: "مطالعهٔ فیزیک", meta: "۰۸:۳۰ تا ۰۹:۳۰", done: false },
  { label: "وقت آزاد", meta: "۲ ساعت", done: false, sun: true },
];

export function SampleDayCard() {
  return (
    <div
      className="mt-8 rounded-2xl border border-slate-200 bg-white p-4"
      aria-label="نمونهٔ یک روز در mr-dan"
    >
      <p className="text-xs text-slate-400">نمونه — یک روز در mr-dan</p>
      <ul className="mt-3 flex flex-col gap-2">
        {dayRows.map((row) => (
          <li
            key={row.label}
            className={`flex items-center gap-3 rounded-xl border p-3 ${
              row.done
                ? "border-teal-200 bg-teal-50"
                : row.sun
                  ? "border-sun bg-sun-soft"
                  : "border-slate-200 bg-white"
            }`}
          >
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                row.done
                  ? "bg-teal-600 text-white"
                  : "border border-slate-300 bg-white"
              }`}
              aria-hidden="true"
            >
              {row.done && <IconCheck size={14} stroke={2.4} />}
            </span>
            <span
              className={`flex-1 text-sm ${
                row.done ? "text-slate-500 line-through" : "font-medium"
              }`}
            >
              {row.label}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500" dir="ltr">
              {row.sun && <IconClock size={13} stroke={1.8} />}
              {row.meta}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
