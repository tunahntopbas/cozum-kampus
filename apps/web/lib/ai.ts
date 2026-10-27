import type { Category, UnitSlug, Urgency } from "./labels";

// Mirrors services/ai/app/schemas/report.py ReportAnalysis.
export type ReportAnalysis = {
  title: string;
  category: Category;
  urgency: Urgency;
  unit: UnitSlug;
  summary: string;
  materials: string[];
  is_sensitive: boolean;
  moderation: { ok: boolean; reasons: string[] };
  confidence: number;
  ai_pending: boolean;
};

export type AnalyzeInput = {
  text: string;
  imagePaths: string[];
  lat?: number;
  lng?: number;
  buildingName?: string;
};

type Options = { timeoutMs?: number; fetchImpl?: typeof fetch; baseUrl?: string };

const DEFAULT_TIMEOUT_MS = 15_000;

export class AiRequestError extends Error {
  constructor(public status: number) {
    super(`AI request failed with ${status}`);
  }
}

export function pendingAnalysis(text: string): ReportAnalysis {
  const t = text.trim();
  return {
    title: t.slice(0, 60) || "Yeni bildirim",
    category: "diger",
    urgency: "orta",
    unit: "yapi_isleri",
    summary: "",
    materials: [],
    is_sensitive: false,
    moderation: { ok: true, reasons: [] },
    confidence: 0,
    ai_pending: true,
  };
}

// The AI service may be asleep (Render free tier) or slow; the student can always submit,
// so timeouts, network errors and 5xx degrade to a pending analysis. Client errors are real errors.
export async function analyzeReport(
  input: AnalyzeInput,
  accessToken: string,
  { timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = fetch, baseUrl = process.env.NEXT_PUBLIC_AI_API_URL ?? "" }: Options = {},
): Promise<ReportAnalysis> {
  const body = {
    text: input.text,
    image_paths: input.imagePaths,
    lat: input.lat,
    lng: input.lng,
    building_name: input.buildingName,
  };
  const request = fetchImpl(`${baseUrl}/ai/analyze-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  });
  const res = await withTimeout(request, timeoutMs);
  if (res === "unavailable") return pendingAnalysis(input.text);
  if (!res.ok) throw new AiRequestError(res.status);
  return (await res.json()) as ReportAnalysis;
}

// Timeouts, network errors and 5xx all mean "the AI service is not available right now".
async function withTimeout(request: Promise<Response>, timeoutMs: number): Promise<Response | "unavailable"> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), timeoutMs);
  });
  try {
    const res = await Promise.race([request, timeout]);
    return res === "timeout" || res.status >= 500 ? "unavailable" : res;
  } catch {
    return "unavailable";
  } finally {
    clearTimeout(timer);
  }
}

export type VerifyInput = { beforePath: string; afterPath: string; category?: string };
export type VerifyResult = { resolved: boolean; confidence: number; note: string; ai_pending: boolean };

const PENDING_VERIFY: VerifyResult = {
  resolved: false,
  confidence: 0,
  note: "Doğrulama şu an yapılamadı, kayıt elle incelenecek.",
  ai_pending: true,
};

// Same contract as analyzeReport: an unavailable service never blocks the technician from finishing the job.
export async function verifyResolution(
  input: VerifyInput,
  accessToken: string,
  { timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = fetch, baseUrl = process.env.NEXT_PUBLIC_AI_API_URL ?? "" }: Options = {},
): Promise<VerifyResult> {
  const request = fetchImpl(`${baseUrl}/ai/verify-resolution`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ before_path: input.beforePath, after_path: input.afterPath, category: input.category }),
  });
  const res = await withTimeout(request, timeoutMs);
  if (res === "unavailable") return PENDING_VERIFY;
  if (!res.ok) throw new AiRequestError(res.status);
  return (await res.json()) as VerifyResult;
}

export type DraftInput = {
  title: string;
  body: string;
  category: string;
  votes: number;
  status: "yeni" | "degerlendiriliyor" | "planlandi" | "uygulandi" | "reddedildi";
};
export type DraftResult = { reply: string; ai_pending: boolean };

const PENDING_DRAFT: DraftResult = { reply: "", ai_pending: true };

// Admin-only reply draft for a student suggestion; the admin edits it before publishing.
export async function draftReply(
  input: DraftInput,
  accessToken: string,
  { timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = fetch, baseUrl = process.env.NEXT_PUBLIC_AI_API_URL ?? "" }: Options = {},
): Promise<DraftResult> {
  const request = fetchImpl(`${baseUrl}/ai/draft-reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });
  const res = await withTimeout(request, timeoutMs);
  if (res === "unavailable") return PENDING_DRAFT;
  if (!res.ok) throw new AiRequestError(res.status);
  return (await res.json()) as DraftResult;
}
