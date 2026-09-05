"use client";

import { useEffect, useState, useCallback } from "react";
import QuestionView from "@/components/QuestionView";
import StatsPanel from "@/components/StatsPanel";
import {
  loadAttempts,
  loadBaselines,
  saveAttempt,
  weakestDomains,
} from "@/lib/storage";
import { MATH_DOMAINS, RW_DOMAINS } from "@/lib/types";
import type { AttemptRecord, QuestionDetail, Subject } from "@/lib/types";

type SubjectFilter = Subject | "mixed";
type View = "practice" | "stats";

export default function Home() {
  const [view, setView] = useState<View>("practice");
  const [subject, setSubject] = useState<SubjectFilter>("mixed");
  const [focusWeak, setFocusWeak] = useState(false);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [baselines] = useState(() => loadBaselines());
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAttempts(loadAttempts());
  }, []);

  const fetchNext = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const recentExclude = attempts
        .slice(-40)
        .map((a) => a.externalId)
        .join(",");

      const allDomainCodes =
        subject === "mixed"
          ? [...RW_DOMAINS, ...MATH_DOMAINS].map((d) => d.code)
          : subject === "rw"
          ? RW_DOMAINS.map((d) => d.code)
          : MATH_DOMAINS.map((d) => d.code);

      const domains = focusWeak
        ? weakestDomains(attempts, subject, allDomainCodes)
        : [];

      const params = new URLSearchParams({
        subject,
        domains: domains.join(","),
        exclude: recentExclude,
      });
      const res = await fetch(`/api/next-question?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't load a question.");
      setQuestion(data as QuestionDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setQuestion(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, focusWeak]);

  useEffect(() => {
    fetchNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject]);

  function handleAnswered(chosen: string, correct: boolean) {
    if (!question) return;
    const record: AttemptRecord = {
      externalId: question.externalId,
      subject: question.subject,
      domain: question.domain,
      domainLabel: question.domainLabel,
      skill: question.skill,
      skillLabel: question.skillLabel,
      difficulty: question.difficulty,
      correct,
      chosen,
      correctAnswers: question.correctAnswers,
      timestamp: Date.now(),
    };
    saveAttempt(record);
    setAttempts((prev) => [...prev, record]);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-5 pb-16 pt-[max(env(safe-area-inset-top),1.5rem)]">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-xl">Drill</h1>
        <nav className="flex gap-1 rounded-full border p-1 text-xs [border-color:var(--ink-800)]">
          <TabButton active={view === "practice"} onClick={() => setView("practice")}>
            Practice
          </TabButton>
          <TabButton active={view === "stats"} onClick={() => setView("stats")}>
            Stats
          </TabButton>
        </nav>
      </header>

      {view === "practice" ? (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
            <SubjectPill value="mixed" current={subject} onClick={setSubject} label="Mixed" />
            <SubjectPill value="rw" current={subject} onClick={setSubject} label="R&W" />
            <SubjectPill value="math" current={subject} onClick={setSubject} label="Math" />
            <button
              onClick={() => setFocusWeak((v) => !v)}
              className={[
                "ml-auto rounded-full border px-3 py-1.5 transition-colors",
                focusWeak
                  ? "[border-color:var(--amber)] [color:var(--amber)]"
                  : "[border-color:var(--ink-800)] text-[var(--paper-dim)]",
              ].join(" ")}
            >
              Focus weak areas
            </button>
          </div>

          <div className="rounded-xl border p-5 [border-color:var(--ink-800)] [background:var(--ink-900)]">
            {loading && <p className="text-sm text-[var(--paper-dim)]">Loading a question…</p>}
            {error && (
              <div className="text-sm">
                <p className="mb-2 text-[var(--clay)]">{error}</p>
                <p className="text-[var(--paper-dim)]">
                  If this keeps happening, the College Board question bank endpoint likely
                  changed shape — see the comment at the top of src/lib/collegeboard.ts for
                  how to fix it.
                </p>
                <button
                  onClick={fetchNext}
                  className="mt-3 rounded-lg border px-4 py-2 text-sm [border-color:var(--ink-700)]"
                >
                  Try again
                </button>
              </div>
            )}
            {!loading && !error && question && (
              <QuestionView question={question} onAnswered={handleAnswered} />
            )}
          </div>

          {!loading && question && (
            <button
              onClick={fetchNext}
              className="mt-4 self-start rounded-lg border px-4 py-2 text-sm [border-color:var(--ink-700)]"
            >
              Next question
            </button>
          )}
        </>
      ) : (
        <StatsPanel attempts={attempts} baselines={baselines} />
      )}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1.5 transition-colors",
        active ? "[background:var(--amber)] [color:var(--ink-950)]" : "text-[var(--paper-dim)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SubjectPill({
  value,
  current,
  onClick,
  label,
}: {
  value: SubjectFilter;
  current: SubjectFilter;
  onClick: (v: SubjectFilter) => void;
  label: string;
}) {
  const active = value === current;
  return (
    <button
      onClick={() => onClick(value)}
      className={[
        "rounded-full border px-3 py-1.5 transition-colors",
        active
          ? "[border-color:var(--amber)] [color:var(--amber)]"
          : "[border-color:var(--ink-800)] text-[var(--paper-dim)]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
