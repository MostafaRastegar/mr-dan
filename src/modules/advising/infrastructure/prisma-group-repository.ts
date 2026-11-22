/**
 * Prisma implementation of GroupRepositoryPort.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import type { GroupSummary, NewGroup } from "@/modules/advising/domain/models";
import type { GroupRepositoryPort } from "@/modules/advising/domain/ports";

const GROUP_SELECT = {
  id: true,
  name: true,
  description: true,
  targetGrade: true,
  targetField: true,
  color: true,
  counselorId: true,
  _count: { select: { members: true } },
} as const;

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  targetGrade: string | null;
  targetField: string | null;
  color: string;
  counselorId: string;
  _count: { members: number };
};

function mapGroup(row: GroupRow): GroupSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    targetGrade: row.targetGrade,
    targetField: row.targetField,
    color: row.color,
    counselorId: row.counselorId,
    studentCount: row._count.members,
  };
}

export class PrismaGroupRepository implements GroupRepositoryPort {
  constructor(private readonly client: PrismaClient = prisma) {}

  async create(input: NewGroup): Promise<GroupSummary> {
    const row = await this.client.group.create({
      data: {
        name: input.name,
        description: input.description,
        targetGrade: input.targetGrade,
        targetField: input.targetField,
        counselorId: input.counselorId,
        ...(input.color ? { color: input.color } : {}),
      },
      select: GROUP_SELECT,
    });
    return mapGroup(row);
  }

  async findById(id: string): Promise<GroupSummary | null> {
    const row = await this.client.group.findUnique({
      where: { id },
      select: GROUP_SELECT,
    });
    return row ? mapGroup(row) : null;
  }

  async listByCounselor(counselorId: string): Promise<GroupSummary[]> {
    const rows = await this.client.group.findMany({
      where: { counselorId },
      select: GROUP_SELECT,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapGroup);
  }
}
