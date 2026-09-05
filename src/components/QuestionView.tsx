"use client";

import { useState, useEffect } from "react";
import type { QuestionDetail } from "@/lib/types";

const DIFFICULTY_LABEL: Record<string, string> = {
  E: "Easy",
  M: "Medium",
  H: "Hard",
};

export default function QuestionView({
  question,
  onAnswered,
}: {
  question: QuestionDetail;
  onAnswered: (chosen: string, correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [gridIn, setGridIn] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSelected(null);
    setGridIn("");
    setSubmitted(false);
  }, [question.externalId]);

  const isCorrect = (value: string) =>
    question.correctAnswers.some(
      (a) => a.trim().toLowerCase() === value.trim().toLowerCase()
    );

  function submit() {
    const value = question.choices ? selected : gridIn;
    if (!value) return;
    setSubmitted(true);
    onAnswered(value, isCorrect(value));
  }

  const chosenValue = question.choices ? selected : gridIn;
  const correct = submitted && chosenValue ? isCorrect(chosenValue) : false;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 font-mono text-xs text-[var(--paper-dim)]">
        <span>{question.subject === "rw" ? "R&W" : "Math"}</span>
        <span>·</span>
        <span>{question.domainLabel}</span>
        <span>·</span>
        <span>{DIFFICULTY_LABEL[question.difficulty] ?? question.difficulty}</span>
      </div>

      <div className="font-serif text-[17px] leading-relaxed">
        {question.stimulusHtml && (
          <div
            className="mb-4 border-l-2 pl-4 [border-color:var(--ink-700)]"
            dangerouslySetInnerHTML={{ __html: question.stimulusHtml }}
          />
        )}
        <div dangerouslySetInnerHTML={{ __html: question.stemHtml }} />
      </div>

      {question.choices ? (
        <div className="flex flex-col gap-2">
          {question.choices.map((choice) => {
            const isSelected = selected === choice.id;
            const isRight = submitted && isCorrect(choice.id);
            const isWrongPick = submitted && isSelected && !isRight;
            return (
              <button
                key={choice.id}
                disabled={submitted}
                onClick={() => setSelected(choice.id)}
                className={[
                  "flex items-start gap-3 rounded-lg border px-4 py-3 text-left text-[15px] transition-colors",
                  "disabled:cursor-default",
                  isRight
                    ? "[border-color:var(--teal)] bg-[color-mix(in_srgb,var(--teal)_14%,transparent)]"
                    : isWrongPick
                    ? "[border-color:var(--clay)] bg-[color-mix(in_srgb,var(--clay)_14%,transparent)]"
                    : isSelected
                    ? "[border-color:var(--amber)] bg-[color-mix(in_srgb,var(--amber)_10%,transparent)]"
                    : "[border-color:var(--ink-700)] hover:[border-color:var(--amber-dim)]",
                ].join(" ")}
              >
                <span className="font-mono text-xs text-[var(--paper-dim)] pt-0.5">
                  {choice.id}
                </span>
                <span dangerouslySetInnerHTML={{ __html: choice.html }} />
              </button>
            );
          })}
        </div>
      ) : (
        <input
          value={gridIn}
          disabled={submitted}
          onChange={(e) => setGridIn(e.target.value)}
          placeholder="Type your answer"
          className="rounded-lg border px-4 py-3 font-mono text-[15px] outline-none [border-color:var(--ink-700)] bg-transparent disabled:opacity-70"
        />
      )}

      {!submitted ? (
        <button
          onClick={submit}
          disabled={question.choices ? !selected : !gridIn}
          className="self-start rounded-lg px-5 py-2.5 text-sm font-medium text-[var(--ink-950)] [background:var(--amber)] disabled:opacity-40"
        >
          Check answer
        </button>
      ) : (
        <div
          className={[
            "rounded-lg border px-4 py-3 text-sm",
            correct
              ? "[border-color:var(--teal)] bg-[color-mix(in_srgb,var(--teal)_10%,transparent)]"
              : "[border-color:var(--clay)] bg-[color-mix(in_srgb,var(--clay)_10%,transparent)]",
          ].join(" ")}
        >
          <p className="font-mono text-xs mb-2 [color:var(--paper)]">
            {correct
              ? "Correct."
              : `Not quite — correct answer: ${question.correctAnswers.join(", ")}`}
          </p>
          {question.rationaleHtml && (
            <div
              className="font-serif text-[15px] leading-relaxed [&_*]:my-1"
              dangerouslySetInnerHTML={{ __html: question.rationaleHtml }}
            />
          )}
        </div>
      )}
    </div>
  );
}
