type RecognitionResult = ArrayLike<{ transcript: string }> & { isFinal: boolean };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
};
type RecognitionCtor = new () => Recognition;

// Browser speech-to-text (guide 2.1: the model API has no audio input). Returns a stop function,
// or null when the browser does not support it.
export function startDictation(onText: (text: string) => void): (() => void) | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;

  const rec = new Ctor();
  rec.lang = "tr-TR";
  rec.interimResults = false;
  rec.continuous = true;
  rec.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) onText(r[0].transcript.trim());
    }
  };
  rec.start();
  return () => rec.stop();
}
