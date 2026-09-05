import type { AttemptRecord, BaselineScore, Subject } from "./types";

const ATTEMPTS_KEY = "sat-trainer:attempts";
const BASELINES_KEY = "sat-trainer:baselines";

// Seeded from what you told me your last two official scores were.
// Edit or add to these any time from the Scores panel.
const DEFAULT_BASELINES: BaselineScore[] = [
  { label: "March 2026 SAT", date: "2026-03", total: 1370, rw: 700, math: 670 },
  { label: "August 2026 SAT", date: "2026-08", total: 1300, rw: 640, math: 660 },
];

export function loadAttempts(): AttemptRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ATTEMPTS_KEY);
    return raw ? (JSON.parse(raw) as AttemptRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveAttempt(attempt: AttemptRecord) {
  if (typeof window === "undefined") return;
  const all = loadAttempts();
  all.push(attempt);
  window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all));
}

export function clearAttempts() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ATTEMPTS_KEY);
}

export function loadBaselines(): BaselineScore[] {
  if (typeof window === "undefined") return DEFAULT_BASELINES;
  try {
    const raw = window.localStorage.getItem(BASELINES_KEY);
    return raw ? (JSON.parse(raw) as BaselineScore[]) : DEFAULT_BASELINES;
  } catch {
    return DEFAULT_BASELINES;
  }
}

export function saveBaselines(baselines: BaselineScore[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BASELINES_KEY, JSON.stringify(baselines));
}

export interface DomainStat {
  domain: string;
  domainLabel: string;
  subject: Subject;
  attempted: number;
  correct: number;
  accuracy: number;
}

export function computeDomainStats(attempts: AttemptRecord[]): DomainStat[] {
  const map = new Map<string, DomainStat>();
  for (const a of attempts) {
    const key = `${a.subject}:${a.domain}`;
    const existing = map.get(key);
    if (existing) {
      existing.attempted += 1;
      existing.correct += a.correct ? 1 : 0;
    } else {
      map.set(key, {
        domain: a.domain,
        domainLabel: a.domainLabel,
        subject: a.subject,
        attempted: 1,
        correct: a.correct ? 1 : 0,
        accuracy: 0,
      });
    }
  }
  for (const stat of map.values()) {
    stat.accuracy = stat.attempted ? stat.correct / stat.attempted : 0;
  }
  return Array.from(map.values()).sort((a, b) => a.accuracy - b.accuracy);
}

export function overallStats(attempts: AttemptRecord[]) {
  const attempted = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  let streak = 0;
  for (let i = attempts.length - 1; i >= 0; i--) {
    if (attempts[i].correct) streak += 1;
    else break;
  }
  const today = new Date().toDateString();
  const todayCount = attempts.filter(
    (a) => new Date(a.timestamp).toDateString() === today
  ).length;
  return {
    attempted,
    correct,
    accuracy: attempted ? correct / attempted : 0,
    streak,
    todayCount,
  };
}

// Domains this user is weakest in get picked more often when
// "focus weak areas" is on. Falls back evenly when there's no history.
export function weakestDomains(
  attempts: AttemptRecord[],
  subject: Subject | "mixed",
  allDomainCodes: string[]
): string[] {
  const stats = computeDomainStats(attempts).filter(
    (s) => subject === "mixed" || s.subject === subject
  );
  const withData = stats.filter((s) => s.attempted >= 3);
  if (withData.length === 0) return allDomainCodes;
  const sorted = [...withData].sort((a, b) => a.accuracy - b.accuracy);
  const weakest = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)));
  return weakest.map((s) => s.domain);
}
