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
});
