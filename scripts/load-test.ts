#!/usr/bin/env tsx
/**
 * Simple load test for KOL System API endpoints.
 * Run: tsx scripts/load-test.ts [base-url] [concurrency] [requests]
 *
 * Example: tsx scripts/load-test.ts http://localhost:3000 10 100
 */

const BASE_URL = process.argv[2] ?? "http://localhost:3000";
const CONCURRENCY = Number(process.argv[3] ?? "5");
const TOTAL_REQUESTS = Number(process.argv[4] ?? "50");

const ENDPOINTS = [
  { method: "GET", path: "/api/health", label: "health" },
  { method: "GET", path: "/api/metrics", label: "metrics" },
  { method: "GET", path: "/api/video-projects", label: "list projects" },
  { method: "GET", path: "/api/analytics/costs?days=7", label: "cost analytics" },
];

interface Result {
  label: string;
  status: number;
  elapsedMs: number;
  error?: string;
}

async function makeRequest(endpoint: (typeof ENDPOINTS)[number]): Promise<Result> {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${endpoint.path}`, {
      method: endpoint.method,
      headers: { "x-user-id": "demo-user" },
    });
    return {
      label: endpoint.label,
      status: res.status,
      elapsedMs: Date.now() - start,
    };
  } catch (err) {
    return {
      label: endpoint.label,
      status: 0,
      elapsedMs: Date.now() - start,
      error: String(err),
    };
  }
}

async function runBatch(batch: (typeof ENDPOINTS)[number][]): Promise<Result[]> {
  return Promise.all(batch.map(makeRequest));
}

async function main() {
  console.log(`Load test: ${BASE_URL}, concurrency=${CONCURRENCY}, requests=${TOTAL_REQUESTS}`);

  const all: Result[] = [];
  const start = Date.now();

  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENCY) {
    const batch = Array.from({ length: Math.min(CONCURRENCY, TOTAL_REQUESTS - i) }, (_, j) => {
      return ENDPOINTS[(i + j) % ENDPOINTS.length];
    });
    const results = await runBatch(batch);
    all.push(...results);
    process.stdout.write(".");
  }

  const totalMs = Date.now() - start;
  console.log(`\n\nCompleted ${all.length} requests in ${totalMs}ms`);
  console.log(`RPS: ${(all.length / (totalMs / 1000)).toFixed(1)}`);

  // Per-endpoint summary
  const byLabel = new Map<string, Result[]>();
  for (const r of all) {
    if (!byLabel.has(r.label)) byLabel.set(r.label, []);
    byLabel.get(r.label)!.push(r);
  }

  console.log("\n--- Per endpoint ---");
  for (const [label, results] of byLabel.entries()) {
    const times = results.map((r) => r.elapsedMs).sort((a, b) => a - b);
    const avg = times.reduce((s, t) => s + t, 0) / times.length;
    const p95 = times[Math.floor(times.length * 0.95)] ?? times[times.length - 1];
    const errors = results.filter((r) => r.status === 0 || r.status >= 500).length;
    console.log(
      `  ${label.padEnd(20)} avg=${avg.toFixed(0)}ms p95=${p95}ms errors=${errors}/${results.length}`
    );
  }
}

main().catch(console.error);
