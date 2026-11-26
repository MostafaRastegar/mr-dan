/**
 * In-memory AdminUsersRepositoryPort fake.
 *
 * Records the page query so tests prove the use case hands the port a
 * `skip/take` slice instead of loading the whole table.
 */

import { NotFoundError } from "@/modules/advising/domain/errors";
import type {
  AdminCounselorOption,
  AdminUserRow,
  Page,
  Role,
} from "@/modules/advising/domain/models";
import type {
  AdminUserListQuery,
  AdminUsersRepositoryPort,
} from "@/modules/advising/domain/ports";

export class FakeAdminUsersRepository implements AdminUsersRepositoryPort {
  private readonly rows = new Map<string, AdminUserRow>();
  private readonly hashes = new Map<string, string>();
  lastQuery: AdminUserListQuery | null = null;

  seed(rows: readonly AdminUserRow[]): void {
    for (const row of rows) this.rows.set(row.id, row);
  }

  count(): number {
    return this.rows.size;
  }

  roleById(id: string): Role | null {
    return this.rows.get(id)?.role ?? null;
  }

  async listUsers(query: AdminUserListQuery): Promise<Page<AdminUserRow>> {
    this.lastQuery = query;
    const needle = query.q?.toLowerCase();
    const sorted = [...this.rows.values()]
      .filter((row) => !query.counselorId || row.counselorId === query.counselorId)
      .filter((row) => !query.role || row.role === query.role)
      .filter(
        (row) =>
          !needle ||
          row.username.toLowerCase().includes(needle) ||
          row.fullName.toLowerCase().includes(needle),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const start = (query.page - 1) * query.pageSize;
    return {
      items: sorted.slice(start, start + query.pageSize),
      page: query.page,
      pageSize: query.pageSize,
      total: sorted.length,
    };
  }

  async listCounselors(): Promise<AdminCounselorOption[]> {
    const ids = new Set(
      [...this.rows.values()]
        .map((row) => row.counselorId)
        .filter((id): id is string => id !== null),
    );
    return [...ids]
      .map((id) => ({ id, username: this.rows.get(id)?.username ?? id }))
      .sort((a, b) => a.username.localeCompare(b.username));
  }

  async findById(id: string): Promise<AdminUserRow | null> {
    return this.rows.get(id) ?? null;
  }

  async countAdmins(): Promise<number> {
    return [...this.rows.values()].filter((row) => row.role === "admin").length;
  }

  async updateRole(userId: string, role: Role): Promise<void> {
    const row = this.rows.get(userId);
    if (!row) throw new NotFoundError("کاربر");
    this.rows.set(userId, { ...row, role });
  }

  async updateProfile(
    userId: string,
    input: { fullName: string; email: string | null },
  ): Promise<void> {
    const row = this.rows.get(userId);
    if (!row) throw new NotFoundError("کاربر");
    this.rows.set(userId, { ...row, fullName: input.fullName, email: input.email });
  }

  async resetPasswordHash(userId: string, passwordHash: string): Promise<void> {
    if (!this.rows.has(userId)) throw new NotFoundError("کاربر");
    this.hashes.set(userId, passwordHash);
  }

  passwordHashOf(userId: string): string | null {
    return this.hashes.get(userId) ?? null;
  }

  rowById(userId: string): AdminUserRow | null {
    return this.rows.get(userId) ?? null;
  }
}
