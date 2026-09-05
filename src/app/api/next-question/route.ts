import { NextRequest, NextResponse } from "next/server";
import { getQuestionDetail, listQuestions } from "@/lib/collegeboard";
import type { Subject } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subjectParam = searchParams.get("subject") ?? "mixed";
  const domainsParam = searchParams.get("domains") ?? "";
  const excludeParam = searchParams.get("exclude") ?? "";
  const exclude = new Set(excludeParam.split(",").filter(Boolean));
  const domains = domainsParam.split(",").filter(Boolean);

  const subjects: Subject[] =
    subjectParam === "mixed" ? ["rw", "math"] : [subjectParam as Subject];

  try {
    const lists = await Promise.all(
      subjects.map((s) => listQuestions(s, domains))
    );
    const pool = lists.flat().filter((q) => {
      const key = q.externalId || q.ibn || "";
      return !exclude.has(key);
    });

    const candidates = pool.length > 0 ? pool : lists.flat();
    if (candidates.length === 0) {
      return NextResponse.json(
        { error: "No questions matched those filters." },
        { status: 404 }
      );
    }

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const detail = await getQuestionDetail(pick);
    return NextResponse.json(detail);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
