/**
 * Presentation-layer zod schema for the physical profile (D-2).
 *
 * Every field is required; ranges come from `domain/energy.ts` so the form,
 * the domain and the DB bounds cannot drift apart. Persian messages land on
 * the issue path, which the form bridge maps to the matching `Form.Item`.
 */

import { z } from "zod";

import {
  ACTIVITY_LEVELS,
  AGE_RANGE,
  DIET_GOALS,
  GENDERS,
  HEIGHT_RANGE,
  WEIGHT_RANGE,
} from "../domain/energy";

export const physicalProfileSchema = z.object({
  age: z.coerce
    .number("سن باید عدد باشد")
    .int("سن باید عدد صحیح باشد")
    .min(AGE_RANGE.min, `سن باید بین ${AGE_RANGE.min} تا ${AGE_RANGE.max} سال باشد`)
    .max(AGE_RANGE.max, `سن باید بین ${AGE_RANGE.min} تا ${AGE_RANGE.max} سال باشد`),
  gender: z.enum(GENDERS, { message: "جنسیت انتخاب‌شده معتبر نیست" }),
  heightCm: z.coerce
    .number("قد باید عدد باشد")
    .int("قد باید عدد صحیح باشد")
    .min(HEIGHT_RANGE.min, `قد باید بین ${HEIGHT_RANGE.min} تا ${HEIGHT_RANGE.max} سانتی‌متر باشد`)
    .max(HEIGHT_RANGE.max, `قد باید بین ${HEIGHT_RANGE.min} تا ${HEIGHT_RANGE.max} سانتی‌متر باشد`),
  weightKg: z.coerce
    .number("وزن باید عدد باشد")
    .int("وزن باید عدد صحیح باشد")
    .min(WEIGHT_RANGE.min, `وزن باید بین ${WEIGHT_RANGE.min} تا ${WEIGHT_RANGE.max} کیلوگرم باشد`)
    .max(WEIGHT_RANGE.max, `وزن باید بین ${WEIGHT_RANGE.min} تا ${WEIGHT_RANGE.max} کیلوگرم باشد`),
  activityLevel: z.enum(ACTIVITY_LEVELS, {
    message: "سطح فعالیت انتخاب‌شده معتبر نیست",
  }),
  dietGoal: z.enum(DIET_GOALS, { message: "هدف غذایی انتخاب‌شده معتبر نیست" }),
});

export type PhysicalProfileInput = z.infer<typeof physicalProfileSchema>;
