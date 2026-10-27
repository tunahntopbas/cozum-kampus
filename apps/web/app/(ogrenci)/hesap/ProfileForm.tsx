"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { TextField, fieldBox } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/client";

export type ProfileView = {
  id: string;
  fullName: string;
  studentNo: string;
  department: string;
  language: string;
  email: string;
};

const LANGUAGES = [
  ["tr", "Türkçe"],
  ["en", "English"],
  ["ar", "العربية"],
] as const;

export function ProfileForm({ profile }: { profile: ProfileView }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.fullName);
  const [language, setLanguage] = useState(profile.language || "tr");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const { error } = await createClient()
      .from("profiles")
      .update({ full_name: fullName.trim(), language })
      .eq("id", profile.id);
    setBusy(false);
    if (error) {
      setMessage({ ok: false, text: "Kaydedilemedi. Biraz sonra yeniden dene." });
      return;
    }
    setMessage({ ok: true, text: "Kaydedildi." });
    router.refresh();
  }

  return (
    <form onSubmit={save} aria-label="Profil bilgileri" className="glass flex flex-col gap-4 p-6">
      <div>
        <h2 className="text-xl font-semibold">Profil bilgileri</h2>
        <p className="text-sm text-muted">Okul hesabından gelen bilgiler değiştirilemez.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <TextField id="ad" label="Ad soyad" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <TextField id="no" label="Öğrenci numarası" value={profile.studentNo || "Belirtilmedi"} readOnly />
        <TextField id="bolum" label="Bölüm" value={profile.department || "Belirtilmedi"} readOnly />
        <div className="flex flex-col gap-2">
          <label className="lbl" htmlFor="dil">
            Dil
          </label>
          <div className={`${fieldBox} bg-surface-strong`}>
            <select
              id="dil"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-ink outline-none"
            >
              {LANGUAGES.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <TextField
        id="eposta"
        label="Okul e-postası"
        value={profile.email}
        readOnly
        hint="Giriş bu e-posta ile yapılır. Durum bildirimleri de buraya gelir."
      />
      <div className="flex items-center justify-end gap-4">
        {message && (
          <p role="status" className={`text-sm ${message.ok ? "text-status-cozuldu-fg" : "text-danger"}`}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="btn-ink t rounded-lg border-0 bg-ink px-3 py-2 text-base font-semibold text-white disabled:opacity-50"
        >
          Değişiklikleri kaydet
        </button>
      </div>
    </form>
  );
}
