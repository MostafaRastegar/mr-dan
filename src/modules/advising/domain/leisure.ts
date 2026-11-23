/**
 * Leisure suggestion from the free-time budget.
 *
 * Inputs are planned minutes and free minutes of the last seven Iran days plus
 * the homework backlog. Five ordered branches,
 * first match wins (D-9). Pure domain: the caller supplies the numbers; no Date,
 * no query, no external import.
 */

export const LEISURE_CODES = [
  "critical_fatigue",
  "heavy_workload",
  "overloaded_week",
  "balanced",
  "low_activity",
] as const;

export type LeisureCode = (typeof LEISURE_CODES)[number];

export interface LeisureInputs {
  plannedMinutes7d: number; // Σ plan rows with dayKey in [today-6, today]
  freeMinutes7d: number; // Σ freeMinutes of budget rows in the same window
  pendingHomework: number;
  overdueHomework: number;
}

export interface LeisureSuggestion {
  code: LeisureCode;
  title: string; // Persian
  reason: string; // Persian, names the numbers that fired
  actions: readonly string[]; // Persian, 2..4 items
}

const fa = new Intl.NumberFormat("fa-IR");

export function suggestLeisure(inputs: LeisureInputs): LeisureSuggestion {
  const { plannedMinutes7d, freeMinutes7d, pendingHomework, overdueHomework } = inputs;
  const util7 = freeMinutes7d > 0 ? plannedMinutes7d / freeMinutes7d : 0;
  const percent = fa.format(Math.round(util7 * 100));
  const planned = fa.format(plannedMinutes7d);
  const free = fa.format(freeMinutes7d);

  if (util7 >= 0.9 && plannedMinutes7d >= 600) {
    return {
      code: "critical_fatigue",
      title: "استراحت فوری",
      reason: `این هفته ${planned} دقیقه از ${free} دقیقهٔ وقت آزاد برنامه‌ریزی شده است (${percent}٪).`,
      actions: ["۳۰ تا ۶۰ دقیقه پیاده‌روی", "خواب کافی امشب"],
    };
  }

  if (overdueHomework >= 3 || pendingHomework >= 8) {
    return {
      code: "heavy_workload",
      title: "بار کاری سنگین",
      reason: `در حال حاضر ${fa.format(overdueHomework)} کار عقب‌افتاده و ${fa.format(pendingHomework)} کار در انتظار دارید.`,
      actions: [
        "سه کار عقب‌افتاده را انتخاب کن",
        "هر کار را در بلوک‌های ۲۵ دقیقه‌ای تقسیم کن",
      ],
    };
  }

  if (util7 >= 0.75 && plannedMinutes7d >= 600) {
    return {
      code: "overloaded_week",
      title: "هفتهٔ پرترافیک",
      reason: `این هفته ${planned} دقیقه از ${free} دقیقهٔ وقت آزاد پر شده است (${percent}٪)؛ یک نفس تازه لازم است.`,
      actions: ["یک نیم‌روز آفلاین در همین هفته", "اعلان‌ها را در آن نیم‌روز خاموش کن"],
    };
  }

  if (overdueHomework === 0 && util7 >= 0.4 && plannedMinutes7d >= 300) {
    return {
      code: "balanced",
      title: "تعادل خوب",
      reason: `این هفته ${planned} دقیقه از ${free} دقیقهٔ وقت آزاد برنامه‌ریزی شده و هیچ کار عقب‌افتاده‌ای نیست.`,
      actions: ["همین ریتم را نگه دار", "برنامهٔ فراغت هفتگی بساز"],
    };
  }

  return {
    code: "low_activity",
    title: "شروع کوچک",
    reason:
      freeMinutes7d > 0
        ? `این هفته ${planned} دقیقه از ${free} دقیقهٔ وقت آزاد برنامه‌ریزی شده است؛ با یک قدم کوچک شروع کنید.`
        : "هنوز وقتی برای این هفته ثبت نشده است؛ با یک قدم کوچک شروع کنید.",
    actions: ["۲۰ دقیقه پیاده‌روی", "۱۰ صفحه کتاب بخوان"],
  };
}
