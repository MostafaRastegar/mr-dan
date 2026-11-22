/**
 * Minimal in-memory Prometheus metrics registry.
 *
 * Tracks counters and histograms with optional labels. Exposed as
 * Prometheus text format via GET /api/metrics.
 *
 * No client library dependency (per AGENTS.md restrictions); we render the
 * text exposition format by hand.
 */

type Labels = Record<string, string>;

class Counter {
  private value = 0;
  inc(n = 1): void {
    this.value += n;
  }
  get(): number {
    return this.value;
  }
}

class Histogram {
  private buckets: Record<string, number> = {};
  private sum = 0;
  private count = 0;

  observe(value: number): void {
    this.sum += value;
    this.count += 1;
    // Leaky bucket-style explicit buckets for latency.
    const bounds = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5];
    let le = "+Inf";
    for (const b of bounds) {
      if (value <= b) {
        le = String(b);
        break;
      }
      this.buckets[`le="${b}"`] = (this.buckets[`le="${b}"`] ?? 0) + 1;
    }
    this.buckets[`le="${le}"`] = (this.buckets[`le="${le}"`] ?? 0) + 1;
  }

  get(): { buckets: Record<string, number>; sum: number; count: number } {
    return { buckets: { ...this.buckets }, sum: this.sum, count: this.count };
  }
}

function escapeLabel(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function labelSet(labels: Labels): string {
  const pairs = Object.entries(labels)
    .map(([k, v]) => `${k}="${escapeLabel(v)}"`)
    .join(",");
  return pairs.length ? `{${pairs}}` : "";
}

export class MetricsRegistry {
  private counters = new Map<string, Counter>();
  private histograms = new Map<string, Histogram>();

  inc(name: string, labels: Labels = {}): void {
    const key = `${name}${labelSet(labels)}`;
    let c = this.counters.get(key);
    if (!c) {
      c = new Counter();
      this.counters.set(key, c);
    }
    c.inc();
  }

  observe(name: string, value: number, labels: Labels = {}): void {
    const key = `${name}${labelSet(labels)}`;
    let h = this.histograms.get(key);
    if (!h) {
      h = new Histogram();
      this.histograms.set(key, h);
    }
    h.observe(value);
  }

  toPrometheusText(): string {
    const lines: string[] = [];

    // Counters
    for (const [key, counter] of this.counters) {
      const [name, labels] = splitKey(key);
      lines.push(`# TYPE ${name} counter`);
      lines.push(`# HELP ${name} Counter metric`);
      lines.push(`${name}${labels} ${counter.get()}`);
      lines.push("");
    }

    // Histograms
    for (const [key, hist] of this.histograms) {
      const [name, labels] = splitKey(key);
      const data = hist.get();
      lines.push(`# TYPE ${name} histogram`);
      lines.push(`# HELP ${name} Histogram metric`);
      const sortedBuckets = Object.entries(data.buckets).sort(
        (a, b) => {
          if (a[0] === `le="+Inf"`) return 1;
          if (b[0] === `le="+Inf"`) return -1;
          return Number(a[0].slice(4, -1)) - Number(b[0].slice(4, -1));
        },
      );
      let cumulative = 0;
      for (const [le, count] of sortedBuckets) {
        cumulative += count;
        lines.push(`${name}_bucket${labels},${le.slice(4)} ${cumulative}`);
      }
      lines.push(`${name}_sum${labels} ${data.sum}`);
      lines.push(`${name}_count${labels} ${data.count}`);
      lines.push("");
    }

    return lines.join("\n");
  }
}

function splitKey(key: string): [string, string] {
  const brace = key.indexOf("{");
  if (brace === -1) return [key, ""];
  return [key.slice(0, brace), key.slice(brace)];
}

/** Singleton registry used across the app. */
export const metrics = new MetricsRegistry();
