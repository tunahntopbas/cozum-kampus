import { afterEach, describe, expect, it, vi } from "vitest";
import { startDictation } from "./speech";

class FakeRecognition {
  static last: FakeRecognition;
  lang = "";
  interimResults = false;
  continuous = false;
  onresult: ((e: unknown) => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  constructor() {
    FakeRecognition.last = this;
  }
}

describe("startDictation", () => {
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  });

  it("returns null when the browser has no speech recognition", () => {
    expect(startDictation(() => {})).toBeNull();
  });

  it("listens in Turkish and reports final transcripts", () => {
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = FakeRecognition;
    const onText = vi.fn();
    const stop = startDictation(onText);
    const rec = FakeRecognition.last;
    expect(rec.lang).toBe("tr-TR");
    expect(rec.start).toHaveBeenCalled();
    rec.onresult?.({
      resultIndex: 0,
      results: [
        Object.assign([{ transcript: "musluk akıyor" }], { isFinal: true }),
        Object.assign([{ transcript: "yarım" }], { isFinal: false }),
      ],
    });
    expect(onText).toHaveBeenCalledWith("musluk akıyor");
    stop?.();
    expect(rec.stop).toHaveBeenCalled();
  });
});
