/**
 * Planning access control (D-1).
 *
 * A write is gated twice: the `<area>:write` capability AND row ownership
 * (`actor.id === ownerId`). A counselor therefore keeps their own plan and can
 * never write a student's row — including their own students'. Read allows self
 * or the owner's current counselor.
 */

import { ForbiddenError } from "@/modules/advising/domain/errors";
import { hasCapability } from "@/modules/advising/domain/capabilities";
import type { Role } from "@/modules/advising/domain/models";
import type { UserRepositoryPort } from "@/modules/advising/domain/ports";

export type Actor = { id: string; role: Role };

export type PlanCapability = "schedule:write" | "homework:write" | "study:write";

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
  if (
    !owner ||
    owner.role !== "student" ||
    owner.counselorId !== actor.id
  ) {
    throw new ForbiddenError();
  }
}

export function isPlanningOwner(actor: Actor, ownerId: string): boolean {
  return actor.id === ownerId;
}
