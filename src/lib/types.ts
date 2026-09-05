export type Subject = "rw" | "math";

export const RW_DOMAINS = [
  { code: "INI", label: "Information and Ideas" },
  { code: "CAS", label: "Craft and Structure" },
  { code: "EOI", label: "Expression of Ideas" },
  { code: "SEC", label: "Standard English Conventions" },
] as const;

export const MATH_DOMAINS = [
  { code: "H", label: "Algebra" },
  { code: "P", label: "Advanced Math" },
  { code: "Q", label: "Problem-Solving and Data Analysis" },
  { code: "S", label: "Geometry and Trigonometry" },
] as const;

export type Difficulty = "E" | "M" | "H";

export interface QuestionListItem {
  externalId: string;
  ibn: string | null;
  subject: Subject;
  domain: string;
  domainLabel: string;
  skill: string;
  skillLabel: string;
  difficulty: Difficulty;
}

export interface QuestionChoice {
  id: string;
  html: string;
}

export interface QuestionDetail {
  externalId: string;
  subject: Subject;
  domain: string;
  domainLabel: string;
  skill: string;
  skillLabel: string;
  difficulty: Difficulty;
  stimulusHtml: string | null;
  stemHtml: string;
  choices: QuestionChoice[] | null;
  correctAnswers: string[];
  rationaleHtml: string;
}

export interface AttemptRecord {
  externalId: string;
  subject: Subject;
  domain: string;
  domainLabel: string;
  skill: string;
  skillLabel: string;
  difficulty: Difficulty;
  correct: boolean;
  chosen: string;
  correctAnswers: string[];
  timestamp: number;
}

export interface BaselineScore {
  label: string;
  date: string;
  total: number;
  rw: number;
  math: number;
}
