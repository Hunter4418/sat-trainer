import type {
  Difficulty,
  QuestionDetail,
  QuestionListItem,
  Subject,
} from "./types";

/**
 * Client for the SAT Suite Question Bank.
 *
 * IMPORTANT: satsuitequestionbank.collegeboard.org has no official public
 * API docs. This talks to the same undocumented endpoints the site's own
 * frontend calls. That contract can change without notice, and it could
 * not be tested from the sandbox this was built in (no network route to
 * collegeboard.org there). If question fetching breaks after you deploy:
 *
 *   1. Open https://satsuitequestionbank.collegeboard.org in Chrome.
 *   2. Open DevTools -> Network -> filter "Fetch/XHR".
 *   3. Search for a question, open one, watch for calls to
 *      qbank-api.collegeboard.org.
 *   4. Compare the request body / response shape you see to BASE_URL,
 *      buildListBody(), buildDetailBody(), and the two parse* functions
 *      below, and adjust field names to match.
 */

const BASE_URL =
  "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questions";

// SAT Suite Question Bank test ids: 1 = Reading and Writing, 2 = Math.
const TEST_ID: Record<Subject, number> = { rw: 1, math: 2 };
const ASMT_EVENT_ID = 99; // SAT (as opposed to PSAT variants)

function buildListBody(subject: Subject, domains: string[]) {
  return {
    asmtEventId: ASMT_EVENT_ID,
    test: TEST_ID[subject],
    domain: domains.join(","),
  };
}

const QBANK_ORIGIN = "https://satsuitequestionbank.collegeboard.org";

async function cbFetch(path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      Origin: QBANK_ORIGIN,
      Referer: `${QBANK_ORIGIN}/`,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `College Board question bank returned ${res.status} for ${path}. ` +
        `The endpoint or payload shape may have changed — see the comment ` +
        `at the top of src/lib/collegeboard.ts.`
    );
  }
  return res.json();
}

// The list endpoint's response has been observed to use either
// snake_case or camelCase keys depending on version; read defensively.
function field(obj: Record<string, unknown>, ...keys: string[]) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

export async function listQuestions(
  subject: Subject,
  domains: string[]
): Promise<QuestionListItem[]> {
  const raw = await cbFetch("get-questions", buildListBody(subject, domains));
  if (!Array.isArray(raw)) {
    throw new Error(
      "Unexpected response shape from get-questions (expected an array)."
    );
  }
  return raw.map((item: Record<string, unknown>) => {
    const domain = String(field(item, "primary_class_cd", "primaryClassCd") ?? "");
    const domainLabel = String(
      field(item, "primary_class_cd_desc", "primaryClassCdDesc") ?? domain
    );
    const skill = String(field(item, "skill_cd", "skillCd") ?? "");
    const skillLabel = String(field(item, "skill_desc", "skillDesc") ?? skill);
    const difficulty = String(
      field(item, "difficulty", "score_band_range_cd") ?? "M"
    ).charAt(0) as Difficulty;
    return {
      externalId: String(field(item, "external_id", "externalId") ?? ""),
      ibn: (field(item, "ibn") as string) ?? null,
      subject,
      domain,
      domainLabel,
      skill,
      skillLabel,
      difficulty: (["E", "M", "H"].includes(difficulty) ? difficulty : "M") as Difficulty,
    };
  }).filter((q) => q.externalId || q.ibn);
}

export async function getQuestionDetail(
  item: QuestionListItem
): Promise<QuestionDetail> {
  const body = item.ibn
    ? { external_id: "", ibn: item.ibn }
    : { external_id: item.externalId };
  const raw = (await cbFetch("get-question", body)) as Record<string, unknown>;

  const stemHtml = String(
    field(raw, "stem", "stem_html", "prompt") ?? ""
  );
  const stimulusHtml = field(raw, "stimulus", "body") as string | undefined;

  const rawOptions = field(raw, "answerOptions", "answer_options") as
    | Array<Record<string, unknown>>
    | undefined;

  const choices = rawOptions
    ? rawOptions.map((opt, i) => ({
        id: String(field(opt, "id") ?? String.fromCharCode(65 + i)),
        html: String(field(opt, "content", "html") ?? ""),
      }))
    : null;

  const correctRaw = field(raw, "correct_answer", "keys", "correctAnswers");
  const correctAnswers = Array.isArray(correctRaw)
    ? correctRaw.map(String)
    : correctRaw
    ? [String(correctRaw)]
    : [];

  const rationaleHtml = String(field(raw, "rationale") ?? "");

  return {
    externalId: item.externalId || item.ibn || "",
    subject: item.subject,
    domain: item.domain,
    domainLabel: item.domainLabel,
    skill: item.skill,
    skillLabel: item.skillLabel,
    difficulty: item.difficulty,
    stimulusHtml: stimulusHtml ?? null,
    stemHtml,
    choices,
    correctAnswers,
    rationaleHtml,
  };
}
