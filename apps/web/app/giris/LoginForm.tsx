"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { isAllowedEmail } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "mt-1 w-full rounded-lg border border-input-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus-ring";

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!isAllowedEmail(email)) {
      setMessage("Okul e-posta adresinle giriş yapabilirsin.");
      return;
    }
    setBusy(true);
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    if (error) {
      setMessage("Kod gönderilemedi. Biraz sonra yeniden dene.");
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    const { error } = await createClient().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setBusy(false);
    if (error) {
      setMessage("Kod doğrulanamadı. Kodu kontrol edip yeniden dene.");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  if (step === "code") {
    return (
      <form onSubmit={verifyCode} className="mt-6 space-y-4">
        <p className="text-sm text-muted">
          <span className="font-medium text-ink">{email.trim()}</span> adresine gelen kodu yaz. E-postadaki bağlantıya
          da tıklayabilirsin.
        </p>
        <label className="block text-sm font-medium">
          Kod
          <input
            className={`${inputClass} font-mono tracking-widest`}
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </label>
        {message && <p className="text-sm text-danger">{message}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          Giriş yap
        </Button>
        <button type="button" onClick={() => setStep("email")} className="w-full text-sm text-accent rounded-lg focus-ring">
          E-postayı değiştir
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">
        Okul e-postası
        <input
          className={inputClass}
          type="email"
          autoComplete="email"
          placeholder="ad.soyad@ogr.sakarya.edu.tr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      {message && <p className="text-sm text-danger">{message}</p>}
      <Button type="submit" className="w-full" disabled={busy}>
        Kod gönder
      </Button>
    </form>
  );
}
