/**
 * Dev-only / opt-in performance logger for back office route audit.
 *
 * Sprint 04-008H - Prisma/runtime latency audit.
 * Detects the gap between app-level timing and raw DB execution.
 *
 * Activation rules (any one is enough):
 *  - `NODE_ENV !== "production"` (always on in dev/test)
 *  - `process.env.PERF_DEBUG_BACK_OFFICE === "true"` (opt-in for staging)
 *
 * Output formats (single line, easy to grep):
 *   [perf][back-office] route=<route> step=<step> durationMs=<number>
 *   [perf][back-office] route=<route> query=<model.method> shape=<static-shape>
 *   [perf][back-office] route=<route> step=<step> rows=<n> durationMs=<number>
 *   [perf][public] route=<route> step=<step> durationMs=<number>
 *   [perf][public] route=<route> step=<step> rows=<n> durationMs=<number>
 *   [perf][prisma] model=<model> action=<action> durationMs=<number>
 *
 * Privacy guardrails:
 *  - Caller is responsible for NOT passing emails, user ids, tokens, sessions,
 *    or document content into `route` / `step`. Helper does not echo any extra
 *    metadata to keep this surface boring on purpose.
 *  - Query shape logging must describe predicates/order/selects without values
 *    (e.g. `where:userId,statusIn`, never the actual userId/desaId/email).
 *  - Prisma event logging must NOT echo raw SQL params or query text.
 *  - No persistence. Goes only to `console.info`.
 */

export function perfEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.PERF_DEBUG_BACK_OFFICE === "true";
}

export function perfStart(): number {
  return Date.now();
}

export function perfLog(route: string, step: string, startedAt: number): void {
  if (!perfEnabled()) return;
  const durationMs = Date.now() - startedAt;
  console.info(`[perf][back-office] route=${route} step=${step} durationMs=${durationMs}`);
}

export function perfLogWithRows(
  route: string,
  step: string,
  rows: number,
  startedAt: number,
): void {
  if (!perfEnabled()) return;
  const durationMs = Date.now() - startedAt;
  console.info(
    `[perf][back-office] route=${route} step=${step} rows=${rows} durationMs=${durationMs}`,
  );
}

export function publicPerfLog(route: string, step: string, startedAt: number): void {
  if (!perfEnabled()) return;
  const durationMs = Date.now() - startedAt;
  console.info(`[perf][public] route=${route} step=${step} durationMs=${durationMs}`);
}

export function publicPerfLogWithRows(
  route: string,
  step: string,
  rows: number,
  startedAt: number,
): void {
  if (!perfEnabled()) return;
  const durationMs = Date.now() - startedAt;
  console.info(`[perf][public] route=${route} step=${step} rows=${rows} durationMs=${durationMs}`);
}

export function perfQueryShape(route: string, query: string, shape: string): void {
  if (!perfEnabled()) return;
  console.info(`[perf][back-office] route=${route} query=${query} shape=${shape}`);
}

export async function perfTime<T>(
  route: string,
  step: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!perfEnabled()) return fn();
  const t = perfStart();
  try {
    return await fn();
  } finally {
    perfLog(route, step, t);
  }
}

/**
 * Dev-only Prisma query event duration logger.
 * Attaches to a PrismaClient to log per-query duration without raw SQL values.
 * Must be called once per Prisma client instance (before any query runs).
 * Uses a module-level guard to prevent double attachment during HMR.
 *
 * Logs:
 *   [perf][prisma] model=<model> action=<action> durationMs=<number>
 *
 * Privacy: does NOT log query text, params, or any user/desa identifiers.
 */
type PrismaClientLike = { $on: (event: "query", callback: (event: unknown) => void) => void };

type PrismaQueryEventLike = {
  duration: number;
  model?: string;
  action?: string;
};

let _prismaPerfAttached = false;

function isPrismaClientLike(prismaClient: unknown): prismaClient is PrismaClientLike {
  return (
    typeof prismaClient === "object" &&
    prismaClient !== null &&
    "$on" in prismaClient &&
    typeof prismaClient.$on === "function"
  );
}

function isPrismaQueryEventLike(event: unknown): event is PrismaQueryEventLike {
  if (typeof event !== "object" || event === null) return false;
  const candidate = event as Record<string, unknown>;
  return typeof candidate.duration === "number";
}

export function attachPrismaPerfLogging(prismaClient: unknown): void {
  if (!perfEnabled()) return;
  if (_prismaPerfAttached) return;
  if (!isPrismaClientLike(prismaClient)) return;
  _prismaPerfAttached = true;
  prismaClient.$on("query", (event: unknown) => {
    if (!isPrismaQueryEventLike(event)) return;
    const ms = Math.round(event.duration); // Prisma query event duration is already in milliseconds
    const model = event.model ?? "unknown";
    const action = event.action ?? "query";
    console.info(`[perf][prisma] model=${model} action=${action} durationMs=${ms}`);
  });
}
