/**
 * Planning access control (D-1).
 *
 * A write is gated twice: the `<area>:write` capability AND row ownership
 * (`actor.id === ownerId`). Homework, nutrition, budget, weekly goal and the
 * school program are therefore student self-features — a counselor or admin
 * self-write is rejected. Read allows self or the owner's current counselor,
 * plus the read-only supervision override (`supervise:read`, admin).
 *
 * Weekly schedule authoring does not use this helper: it is
 * counselor-of-record only (`assertCounselorOfStudent`).
 */

import { ForbiddenError } from "@/modules/advising/domain/errors";
import { hasCapability } from "@/modules/advising/domain/capabilities";
import type { Role, UserAccount } from "@/modules/advising/domain/models";
import type { UserRepositoryPort } from "@/modules/advising/domain/ports";

export type Actor = { id: string; role: Role };

export type PlanCapability =
  | "profile:write"
  | "goal:write"
  | "program:write"
  | "homework:write"
  | "budget:write"
  | "nutrition:write";

export function assertPlanWrite(
  actor: Actor,
  capability: PlanCapability,
  ownerId: string,
): void {
  if (!hasCapability(actor.role, capability)) {
    throw new ForbiddenError();
  }
  if (ownerId !== actor.id) {
    throw new ForbiddenError();
  }
}

export async function assertPlanRead(
  users: UserRepositoryPort,
  actor: Actor,
  ownerId: string,
): Promise<void> {
  if (ownerId === actor.id) return;

  const owner = await users.findById(ownerId);
  if (owner && owner.role === "student" && owner.counselorId === actor.id) {
    return;
  }

  // Admin supervision: any user's planning rows, read-only. The write guards
  // above stay untouched, so this branch can never mutate.
  if (hasCapability(actor.role, "supervise:read")) return;

  throw new ForbiddenError();
}

/** A counselor may only touch their own students' plans. */
export async function assertCounselorOfStudent(
  users: UserRepositoryPort,
  actor: Actor,
  studentId: string,
): Promise<UserAccount> {
  if (!hasCapability(actor.role, "plan:write")) {
    throw new ForbiddenError();
  }
  const owner = await users.findById(studentId);
  if (!owner || owner.role !== "student" || owner.counselorId !== actor.id) {
    throw new ForbiddenError();
  }
  return owner;
}
