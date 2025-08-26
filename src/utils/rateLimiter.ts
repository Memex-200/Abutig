export interface RateLimitRule {
  key: string;
  windowMs: number; // time window in milliseconds
  max: number; // max allowed within window
}

interface WindowEntry {
  ts: number;
}

const STORAGE_PREFIX = "rate_limit:";

function getNow(): number {
  return Date.now();
}

function readWindow(rule: RateLimitRule): WindowEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + rule.key);
    if (!raw) return [];
    const arr = JSON.parse(raw) as WindowEntry[];
    if (!Array.isArray(arr)) return [];
    return arr.filter((e) => typeof e?.ts === "number");
  } catch {
    return [];
  }
}

function writeWindow(rule: RateLimitRule, entries: WindowEntry[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + rule.key, JSON.stringify(entries));
  } catch {}
}

export function isRateLimited(rule: RateLimitRule): {
  limited: boolean;
  remaining: number;
  resetMs: number;
} {
  const now = getNow();
  const from = now - rule.windowMs;
  const entries = readWindow(rule).filter((e) => e.ts >= from);
  const limited = entries.length >= rule.max;
  const resetMs =
    entries.length === 0 ? 0 : Math.max(0, entries[0].ts + rule.windowMs - now);
  return {
    limited,
    remaining: Math.max(0, rule.max - entries.length),
    resetMs,
  };
}

export function recordAttempt(rule: RateLimitRule) {
  const now = getNow();
  const from = now - rule.windowMs;
  const entries = readWindow(rule).filter((e) => e.ts >= from);
  entries.push({ ts: now });
  writeWindow(rule, entries);
}
