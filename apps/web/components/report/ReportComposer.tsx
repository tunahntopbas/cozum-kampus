"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { EyeSlash, PaperPlaneTilt, ShieldCheck } from "@phosphor-icons/react";
import { Switch } from "@/components/ui/Switch";
import { AiRequestError, analyzeReport, pendingAnalysis, type ReportAnalysis } from "@/lib/ai";
import { prepareImage } from "@/lib/image";
import { unitForCategory, type Category } from "@/lib/labels";
import { canSubmit, type ReportForm } from "@/lib/report";
import { startDictation } from "@/lib/speech";
import { submitReport } from "@/lib/submit";
import { createClient } from "@/lib/supabase/client";
import { uploadReportImage } from "@/lib/upload";
import { AnalysisPanel, type AnalysisState } from "./AnalysisPanel";
import { DescriptionField } from "./DescriptionField";
import { InputTabs, type InputMode } from "./InputTabs";
import { LocationPicker, type Building, type LocationValue, type QrPlace } from "./LocationPicker";
import { MAX_PHOTOS, PhotoPicker, type Photo } from "./PhotoPicker";
import { SafetyCard } from "./SafetyCard";

const TEXT_DEBOUNCE_MS = 800;

const AI_ERRORS: Record<number, string> = {
  403: "Bu fotoğrafa erişilemedi. Fotoğrafı yeniden yükle.",
  413: `En fazla ${MAX_PHOTOS} fotoğraf, her biri 5 MB olabilir.`,
  429: "Kısa sürede çok fazla analiz istedin. Biraz bekleyip yeniden dene.",
};

type Props = {
  userId: string;
  buildings: Building[];
  unitIdBySlug: Record<string, number>;
  qrPlace: QrPlace | null;
};

export function ReportComposer({ userId, buildings, unitIdBySlug, qrPlace: initialQr }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("foto");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const stopDictation = useRef<(() => void) | null>(null);
  const [qrPlace, setQrPlace] = useState(initialQr);
  const [location, setLocation] = useState<LocationValue>({
    buildingId: initialQr?.buildingId ?? null,
    floor: initialQr?.floor ?? null,
    placeId: initialQr?.id ?? null,
    lat: null,
    lng: null,
  });
  const [locating, setLocating] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [analysis, setAnalysis] = useState<ReportAnalysis | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const requestSeq = useRef(0);

  const buildingName = useMemo(
    () => qrPlace?.buildingName ?? buildings.find((b) => b.id === location.buildingId)?.name,
    [qrPlace, buildings, location.buildingId],
  );
  const photoPaths = photos.map((p) => p.path).join("|");
  const hasInput = Boolean(photoPaths || text.trim());
  // Sending mid-analysis would file the report unrouted and hidden, so wait for the verdict.
  const inputKey = `${photoPaths}\n${text}`;
  const [analysedKey, setAnalysedKey] = useState<string | null>(null);
  const analysing = hasInput && (analysisState === "loading" || analysedKey !== inputKey);

  // Re-analyse whenever the photos or (after a pause) the text change.
  useEffect(() => {
    const paths = photoPaths ? photoPaths.split("|") : [];
    if (!paths.length && !text.trim()) return;
    const seq = ++requestSeq.current;
    const timer = setTimeout(async () => {
      setAnalysisState("loading");
      const { data } = await createClient().auth.getSession();
      try {
        const result = await analyzeReport(
          {
            text,
            imagePaths: paths,
            buildingName,
            lat: location.lat ?? undefined,
            lng: location.lng ?? undefined,
          },
          data.session?.access_token ?? "",
        );
        if (seq !== requestSeq.current) return;
        setAnalysis(result);
        setMessage(null);
      } catch (e) {
        if (seq !== requestSeq.current) return;
        setAnalysis(null);
        setMessage(e instanceof AiRequestError ? (AI_ERRORS[e.status] ?? null) : null);
      }
      setAnalysisState("done");
      setAnalysedKey(`${photoPaths}\n${text}`);
    }, TEXT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // Location is sent as context only; moving the pin does not need a new analysis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoPaths, text]);

  useEffect(() => () => stopDictation.current?.(), []);

  async function addPhotos(files: File[]) {
    setUploading(true);
    setMessage(null);
    try {
      for (const file of files) {
        const blob = await prepareImage(file);
        const path = await uploadReportImage(userId, blob);
        setPhotos((prev) => [...prev, { path, previewUrl: URL.createObjectURL(blob) }].slice(0, MAX_PHOTOS));
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Fotoğraf yüklenemedi");
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(path: string) {
    setPhotos((prev) => prev.filter((p) => p.path !== path));
  }

  function toggleDictation() {
    if (listening) {
      stopDictation.current?.();
      stopDictation.current = null;
      setListening(false);
      return;
    }
    const stop = startDictation((t) => setText((prev) => (prev ? `${prev} ${t}` : t)));
    if (!stop) {
      setMessage("Tarayıcın sesli anlatımı desteklemiyor, yazarak devam edebilirsin.");
      return;
    }
    stopDictation.current = stop;
    setListening(true);
  }

  function changeMode(m: InputMode) {
    setMode(m);
    if (m === "ses" && !listening) toggleDictation();
    if (m !== "ses" && listening) toggleDictation();
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setMessage("Tarayıcın konum paylaşmayı desteklemiyor, binayı listeden seç.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation((l) => ({ ...l, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setLocating(false);
      },
      () => {
        setMessage("Konum alınamadı. Binayı listeden seçebilirsin.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  function changeCategory(category: Category) {
    setAnalysis((a) => (a ? { ...a, category, unit: unitForCategory(category, a.is_sensitive) } : a));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const form: ReportForm = {
      text,
      imagePaths: photos.map((p) => p.path),
      isAnonymous: anonymous,
      buildingId: location.buildingId,
      placeId: location.placeId,
      floor: location.floor,
      lat: location.lat,
      lng: location.lng,
    };
    const current = hasInput ? analysis : null;
    const check = canSubmit(current, form);
    if (!check.ok) {
      setMessage(check.message);
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const id = await submitReport(createClient(), form, current ?? pendingAnalysis(text), userId, unitIdBySlug);
      router.push(`/bildirimlerim?yeni=${id}`);
    } catch {
      setMessage("Bildirim gönderilemedi. Bağlantını kontrol edip yeniden dene.");
      setSubmitting(false);
    }
  }

  const securityLocation = location.lat != null ? `SRID=4326;POINT(${location.lng} ${location.lat})` : null;

  return (
    <div className="cols grid grid-cols-[minmax(0,1fr)_400px] items-start gap-4">
      <form aria-label="Bildirim formu" onSubmit={submit} className="glass flex flex-col gap-6 p-6">
        <InputTabs mode={mode} onChange={changeMode} />

        {mode === "foto" && (
          <PhotoPicker
            photos={photos}
            uploading={uploading}
            aiLabel={analysis && !analysis.ai_pending ? analysis.title : undefined}
            onAdd={addPhotos}
            onRemove={removePhoto}
          />
        )}

        <DescriptionField
          value={text}
          onChange={setText}
          listening={listening}
          onToggleDictation={toggleDictation}
          required={mode !== "foto" || photos.length === 0}
        />

        <LocationPicker
          buildings={buildings}
          value={location}
          qrPlace={qrPlace}
          onChange={setLocation}
          onUnlockQr={() => {
            setQrPlace(null);
            setLocation((l) => ({ ...l, placeId: null }));
          }}
          locating={locating}
          onUseMyLocation={useMyLocation}
        />

        {/* On phones the side column drops below the form, so the verdict is shown here, above the send button. */}
        {hasInput && (
          <div className="min-[961px]:hidden">
            <AnalysisPanel state={analysisState} analysis={analysis} onCategoryChange={changeCategory} />
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-hairline pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <EyeSlash size={20} className="mt-0.5 flex-none" aria-hidden />
              <div>
                <p className="lbl">Anonim bildir</p>
                <p className="text-xs text-muted">Birimler adını görmez, durum bildirimlerini yine alırsın.</p>
              </div>
            </div>
            <Switch checked={anonymous} onChange={setAnonymous} label="Anonim bildir" hideLabel />
          </div>
          {message && (
            <p role="alert" className="rounded-lg bg-[#FEF2F2] p-3 text-sm text-danger">
              {message}
            </p>
          )}
          <div className="flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
            <div className="flex items-center gap-2 text-muted">
              <ShieldCheck size={16} aria-hidden />
              <p className="text-xs">Göndermeden önce fotoğraf ve metin otomatik denetlenir</p>
            </div>
            <button
              type="submit"
              disabled={submitting || uploading || analysing}
              className="btn-ink t flex items-center justify-center gap-2 rounded-lg border-0 bg-ink px-3 py-2 text-base font-semibold text-white disabled:opacity-50"
            >
              <PaperPlaneTilt size={20} weight="fill" aria-hidden />
              {submitting ? "Gönderiliyor" : analysing ? "Analiz bekleniyor" : "Bildirimi gönder"}
            </button>
          </div>
        </div>
      </form>

      <div className="flex flex-col gap-4">
        <div className="max-[960px]:hidden">
          <AnalysisPanel
            state={hasInput ? analysisState : "idle"}
            analysis={hasInput ? analysis : null}
            onCategoryChange={changeCategory}
          />
        </div>
        <SafetyCard location={securityLocation} />
      </div>
    </div>
  );
}
