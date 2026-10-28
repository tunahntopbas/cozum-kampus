import { CATEGORIES, type Category, type UnitSlug, type Urgency } from "./labels";

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

// Longer than the AI service's own LLM timeout (LLM_TIMEOUT_S=25): a photo analysis can take ~15 s, and giving up
// first would file the report unmoderated even though the service was about to answer.
const DEFAULT_TIMEOUT_MS = 30_000;

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
    moderation: { ok: false, reasons: ["İçerik denetimi tamamlanamadı."] },
    confidence: 0,
    ai_pending: true,
  };
}

// Availability failures produce an unapproved pending result, never permission to publish.
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
  try {
    const result: unknown = await res.json();
    return isReportAnalysis(result) ? result : pendingAnalysis(input.text);
  } catch {
    return pendingAnalysis(input.text);
  }
}

// Validate the wire response rather than treating a TypeScript cast as validation.
function isReportAnalysis(value: unknown): value is ReportAnalysis {
  if (!value || typeof value !== "object") return false;
  const a = value as ReportAnalysis;
  return typeof a.title === "string" && a.title.trim().length > 0 &&
    CATEGORIES.includes(a.category) && ["dusuk", "orta", "acil"].includes(a.urgency) &&
    ["yapi_isleri", "bilgi_islem", "temizlik", "yemekhane", "guvenlik"].includes(a.unit) &&
    typeof a.summary === "string" && Array.isArray(a.materials) && a.materials.every((m) => typeof m === "string") &&
    typeof a.is_sensitive === "boolean" && typeof a.ai_pending === "boolean" &&
    typeof a.confidence === "number" && Number.isFinite(a.confidence) && a.confidence >= 0 && a.confidence <= 1 &&
    !!a.moderation && typeof a.moderation.ok === "boolean" && Array.isArray(a.moderation.reasons) &&
    a.moderation.reasons.every((r) => typeof r === "string") &&
    !(a.moderation.ok && a.moderation.reasons.length > 0);
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
