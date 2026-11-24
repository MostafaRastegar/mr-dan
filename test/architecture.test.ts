import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

type SourceFile = { path: string; imports: string[] };

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "generated") return [];
      return walk(full);
    }
    return /\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

const IMPORT_RE = /(?:from\s+|import\s*\()\s*["']([^"']+)["']/g;

function collect(): SourceFile[] {
  return walk(SRC).map((path) => {
    const code = readFileSync(path, "utf8");
    const imports = [...code.matchAll(IMPORT_RE)].map((match) => match[1]);
    return { path: relative(SRC, path).replaceAll("\\", "/"), imports };
  });
}

const files = collect();

const layerOf = (path: string): string => {
  const match = /^modules\/[^/]+\/(domain|application|infrastructure|presentation)\//.exec(path);
  if (match) return match[1];
  if (path.startsWith("app/api/")) return "api";
  if (path.startsWith("app/") || path.startsWith("components/")) return "ui";
  if (path.startsWith("server/")) return "server";
  if (path.startsWith("shared/") || path.startsWith("generated/")) return "shared";
  return "other";
};

/** Map an import specifier to a project-relative source path, or null when external. */
function resolveInternal(specifier: string): string | null {
  const target = specifier.startsWith("@/") ? specifier.slice(2) : null;
  if (target) return target;
  if (!specifier.startsWith(".")) return null;
  return null;
}

const FORBIDDEN: Record<string, string[]> = {
  domain: ["application", "infrastructure", "presentation", "api", "ui", "server"],
  application: ["infrastructure", "presentation", "api", "ui", "server"],
  presentation: ["infrastructure", "api", "ui", "server"],
  infrastructure: ["api", "ui"],
};

const EXTERNAL_FORBIDDEN: Record<string, string[]> = {
  domain: [
    "next",
    "react",
    "react-dom",
    "zod",
    "antd",
    "pino",
    "chromadb",
    "@prisma/",
    "@langchain/",
  ],
};

describe("architecture", () => {
  it("finds source files to check", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("domain depends on nothing external", () => {
    const domainFiles = files.filter((file) => layerOf(file.path) === "domain");
    expect(domainFiles.length).toBeGreaterThan(0);

    const violations = domainFiles.flatMap((file) =>
      file.imports
        .filter((specifier) =>
          EXTERNAL_FORBIDDEN.domain.some(
            (banned) => specifier === banned || specifier.startsWith(`${banned}`),
          ),
        )
        .map((specifier) => `${file.path} imports ${specifier}`),
    );

    expect(violations).toEqual([]);
  });

  it("respects layer direction", () => {
    const violations = files.flatMap((file) => {
      const from = layerOf(file.path);
      const banned = FORBIDDEN[from];
      if (!banned) return [];

      return file.imports.flatMap((specifier) => {
        const target = resolveInternal(specifier);
        if (!target) return [];
        const to = layerOf(target);
        return banned.includes(to) ? [`${file.path} (${from}) → ${target} (${to})`] : [];
      });
    });

    expect(violations).toEqual([]);
  });

  it("keeps route handlers thin", () => {
    const routes = files.filter((file) => file.path.startsWith("app/api/"));
    expect(routes.length).toBeGreaterThan(0);

    const fat = routes
      .map((file) => ({
        path: file.path,
        lines: readFileSync(join(SRC, file.path), "utf8").split("\n").length,
      }))
      .filter(({ lines }) => lines > 40);

    expect(fat).toEqual([]);
  });

  it("splits client components past 80 lines", () => {
    const clientFiles = files.filter(
      (file) =>
        (file.path.startsWith("components/") ||
          file.path.startsWith("app/")) &&
        file.path.endsWith(".tsx"),
    );

    const largeClient = clientFiles.filter((file) => {
      const code = readFileSync(join(SRC, file.path), "utf8");
      return code.startsWith('"use client"') && code.split("\n").length > 80;
    });

    const violations = largeClient.flatMap((file) => {
      const isVm = file.path.endsWith(".vm.tsx");
      const base = file.path.replace(/\.vm\.tsx$/, "");
      const viewExists = files.some((f) => f.path === `${base}.view.tsx`);
      return isVm && viewExists ? [] : [`${file.path} lacks .vm.tsx/.view.tsx pair`];
    });

    expect(violations).toEqual([]);
  });

  const TEST = join(process.cwd(), "test");

  it("test doubles live under test/fakes/", () => {
    const testFiles = walk(TEST).map((p) =>
      relative(join(process.cwd(), "test"), p).replaceAll("\\", "/"),
    );
    const fakes = testFiles.filter((p) => p.startsWith("fakes/"));
    // non-vacuous positive: at least one fake exists under test/fakes/
    expect(fakes.length).toBeGreaterThan(0);
    // no test double lives under src/test/ (that directory must not exist)
    const underSrcTest = files.some((f) => f.path.startsWith("test/"));
    expect(underSrcTest).toBe(false);
    // every file under test/ that looks like a double lives under test/fakes/
    const doublesOutside = testFiles.filter(
      (p) => !p.startsWith("fakes/") && /(fake|probe|stub|mock)/i.test(p),
    );
    expect(doublesOutside).toEqual([]);
  });

  it("every data route is session- or admin-gated", () => {
    const sessionGated = [
      "app/api/documents/route.ts",
      "app/api/documents/[id]/route.ts",
      "app/api/conversations/route.ts",
      "app/api/conversations/[id]/route.ts",
      "app/api/ingest/route.ts",
      "app/api/upload/route.ts",
      "app/api/search/route.ts",
      "app/api/chat/route.ts",
      "app/api/chat/stream/route.ts",
    ];
    const adminGated = [
      "app/api/admin/chunks/route.ts",
      "app/api/admin/chunks/[id]/route.ts",
      "app/api/admin/stats/route.ts",
      "app/api/admin/cache/clear/route.ts",
      "app/api/admin/retrieval/debug/route.ts",
      "app/api/openapi/route.ts",
    ];

    const verifiedSession: string[] = [];
    const verifiedAdmin: string[] = [];

    for (const rel of sessionGated) {
      const file = files.find((f) => f.path === rel);
      if (!file) throw new Error(`missing route file: ${rel}`);
      if (file.imports.some((i) => i.includes("advising-guards")) && readFileSync(join(SRC, file.path), "utf8").includes("requireApiSession")) {
        verifiedSession.push(rel);
      }
    }
    for (const rel of adminGated) {
      const file = files.find((f) => f.path === rel);
      if (!file) throw new Error(`missing route file: ${rel}`);
      if (readFileSync(join(SRC, file.path), "utf8").includes('requireApiCapability("rag:manage")')) {
        verifiedAdmin.push(rel);
      }
    }

    expect(verifiedSession).toHaveLength(9);
    expect(verifiedAdmin).toHaveLength(6);
  });

  it("keeps the page triad next to every page", () => {
    const pages = files.filter((f) => /^app\/(.+\/)?page\.tsx$/.test(f.path));
    const withLocalUi = pages.filter((p) =>
      p.imports.some((i) => i.startsWith("./") || i.startsWith("../")),
    );
    expect(withLocalUi).toHaveLength(13);
    const violations = withLocalUi.flatMap((page) => {
      const dir = page.path.slice(0, page.path.lastIndexOf("/"));
      const siblings = files.filter(
        (f) =>
          f.path.startsWith(`${dir}/`) &&
          f.path.split("/").length === page.path.split("/").length,
      );
      const vms = siblings.filter((f) => f.path.endsWith(".vm.tsx"));
      const out: string[] = [];
      if (vms.length === 0) out.push(`${page.path} has no sibling .vm.tsx`);
      for (const vm of vms) {
        const base = vm.path.replace(/\.vm\.tsx$/, "");
        if (!files.some((f) => f.path === `${base}.view.tsx`))
          out.push(`${vm.path} lacks sibling .view.tsx`);
        const spec = `./${vm.path.slice(vm.path.lastIndexOf("/") + 1).replace(/\.tsx$/, "")}`;
        if (!page.imports.includes(spec))
          out.push(`${page.path} does not import ${spec}`);
      }
      return out;
    });
    expect(violations).toEqual([]);
  });

  it("keeps pages under 40 lines", () => {
    const pages = files.filter((f) => /(^|\/)page\.tsx$/.test(f.path));
    expect(pages.length).toBeGreaterThanOrEqual(14);
    const fat = pages
      .map((p) => ({
        path: p.path,
        lines: readFileSync(join(SRC, p.path), "utf8").split("\n").length,
      }))
      .filter(({ lines }) => lines > 40);
    expect(fat).toEqual([]);
  });
});
