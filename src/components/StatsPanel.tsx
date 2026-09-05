"use client";

import type { AttemptRecord, BaselineScore } from "@/lib/types";
import { computeDomainStats, overallStats } from "@/lib/storage";

export default function StatsPanel({
  attempts,
  baselines,
}: {
  attempts: AttemptRecord[];
  baselines: BaselineScore[];
}) {
  const overall = overallStats(attempts);
  const domains = computeDomainStats(attempts);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3 font-mono">
        <Stat label="answered" value={String(overall.attempted)} />
        <Stat
          label="accuracy"
          value={overall.attempted ? `${Math.round(overall.accuracy * 100)}%` : "—"}
        />
        <Stat label="streak" value={String(overall.streak)} />
      </div>

      <div>
        <h2 className="mb-2 text-sm text-[var(--paper-dim)]">Official scores</h2>
        <div className="flex flex-col divide-y [&>*]:[border-color:var(--ink-800)]">
          {baselines
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((b) => (
              <div key={b.label} className="flex items-baseline justify-between py-2">
                <span className="text-sm">{b.label}</span>
                <span className="font-mono text-sm">
                  {b.total}{" "}
                  <span className="text-[var(--paper-dim)]">
                    (R&W {b.rw} · Math {b.math})
                  </span>
                </span>
              </div>
            ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm text-[var(--paper-dim)]">By domain</h2>
        {domains.length === 0 ? (
          <p className="text-sm text-[var(--paper-dim)]">
            Answer some questions and this fills in — weakest areas rise to the top.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {domains.map((d) => (
              <div key={`${d.subject}-${d.domain}`} className="flex items-center gap-3">
                <div className="w-32 shrink-0 truncate text-sm">{d.domainLabel}</div>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full [background:var(--ink-800)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round(d.accuracy * 100)}%`,
                      background:
                        d.accuracy < 0.6 ? "var(--clay)" : d.accuracy < 0.8 ? "var(--amber)" : "var(--teal)",
                    }}
                  />
                </div>
                <div className="w-16 shrink-0 text-right font-mono text-xs text-[var(--paper-dim)]">
                  {d.correct}/{d.attempted}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-3 py-2 [border-color:var(--ink-800)]">
      <div className="text-lg">{value}</div>
      <div className="text-[11px] text-[var(--paper-dim)]">{label}</div>
    </div>
  );
}
