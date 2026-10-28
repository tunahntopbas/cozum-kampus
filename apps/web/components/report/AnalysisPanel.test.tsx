import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReportAnalysis } from "@/lib/ai";
import { AnalysisPanel } from "./AnalysisPanel";

const A: ReportAnalysis = {
  title: "Koridor lambası yanmıyor",
  category: "aydinlatma",
  urgency: "orta",
  unit: "yapi_isleri",
  summary: "Armatür yanmıyor.",
  materials: [],
  is_sensitive: false,
  moderation: { ok: true, reasons: [] },
  confidence: 0.94,
  ai_pending: false,
};

describe("AnalysisPanel", () => {
  it("shows the rejection and its reason as soon as the analysis finishes", () => {
    const rejected = { ...A, moderation: { ok: false, reasons: ["Görsel yüz odaklı bir selfie."] } };
    render(<AnalysisPanel state="done" analysis={rejected} onCategoryChange={() => {}} onRetry={() => {}} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Bu bildirim gönderilemez");
    expect(screen.getByRole("alert")).toHaveTextContent("Görsel yüz odaklı bir selfie.");
    expect(screen.getByText("Reddedildi")).toBeInTheDocument();
  });

  it("offers a retry when the AI could not answer", () => {
    const onRetry = vi.fn();
    render(<AnalysisPanel state="done" analysis={{ ...A, ai_pending: true }} onCategoryChange={() => {}} onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "Yeniden analiz et" }));
    expect(onRetry).toHaveBeenCalled();
  });
});
