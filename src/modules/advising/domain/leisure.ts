/**
 * Leisure suggestion from already-computed aggregates.
 *
 * Five ordered branches, first match wins (D-5). Pure domain: the caller
 * supplies the numbers; no Date, no query, no external import.
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
  studyMinutes7d: number; // study rows only, never break/waste
  studyMinutes3d: number;
  pendingHomework: number;
  overdueHomework: number;
}

export interface LeisureSuggestion {
  code: LeisureCode;
  title: string; // Persian
  reason: string; // Persian, names the numbers that fired
  actions: readonly string[]; // Persian, 2..4 items
}

export function suggestLeisure(inputs: LeisureInputs): LeisureSuggestion {
  const { studyMinutes7d, studyMinutes3d, pendingHomework, overdueHomework } = inputs;

  if (studyMinutes3d >= 900 || studyMinutes7d >= 2100) {
    return {
      code: "critical_fatigue",
      title: "استراحت فوری",
      reason: `در سه روز اخیر ${studyMinutes3d} دقیقه و در هفته ${studyMinutes7d} دقیقه مطالعه ثبت شده است.`,
      actions: ["۳۰ تا ۶۰ دقیقه پیاده‌روی", "خواب کافی امشب"],
    };
  }

  if (overdueHomework >= 3 || pendingHomework >= 8) {
    return {
      code: "heavy_workload",
      title: "بار کاری سنگین",
      reason: `در حال حاضر ${overdueHomework} کار عقب‌افتاده و ${pendingHomework} کار در انتظار دارید.`,
      actions: [
        "سه کار عقب‌افتاده را انتخاب کن",
        "هر کار را در بلوک‌های ۲۵ دقیقه‌ای تقسیم کن",
      ],
    };
  }

  if (studyMinutes7d >= 1500) {
    return {
      code: "overloaded_week",
      title: "هفتهٔ پرترافیک",
      reason: `این هفته ${studyMinutes7d} دقیقه مطالعه کرده‌اید؛ یک نفس تازه لازم است.`,
      actions: ["یک نیم‌روز آفلاین در همین هفته", "اعلان‌ها را در آن نیم‌روز خاموش کن"],
    };
  }

  if (studyMinutes7d >= 600 && overdueHomework === 0) {
    return {
      code: "balanced",
      title: "تعادل خوب",
      reason: `این هفته ${studyMinutes7d} دقیقه مطالعه با صفر کار عقب‌افتاده ثبت شده است.`,
      actions: ["همین ریتم را نگه دار", "برنامهٔ فراغت هفتگی بساز"],
    };
  }

  return {
    code: "low_activity",
    title: "شروع کوچک",
    reason: `این هفته ${studyMinutes7d} دقیقه مطالعه ثبت شده است؛ با یک قدم کوچک شروع کنید.`,
    actions: ["۲۰ دقیقه پیاده‌روی", "۱۰ صفحه کتاب بخوان"],
  };
}
