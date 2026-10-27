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
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), timeoutMs);
  });

  let res: Response | "timeout";
  try {
    res = await Promise.race([request, timeout]);
  } catch {
    return pendingAnalysis(input.text);
  } finally {
    clearTimeout(timer);
  }
  if (res === "timeout" || res.status >= 500) return pendingAnalysis(input.text);
  if (!res.ok) throw new AiRequestError(res.status);
  return (await res.json()) as ReportAnalysis;
}
