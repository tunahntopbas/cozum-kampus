"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { isAllowedEmail } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-input-border bg-white px-3.5 text-[15px] text-ink placeholder:text-muted/70 transition-colors hover:border-[#b9c3d3] focus:border-ink focus:outline-none";
const linkClass = "w-full rounded-lg text-sm text-accent focus-ring";

type Step = "password" | "otp-email" | "otp-code";

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function go(nextStep: Step) {
    setMessage(null);
    setStep(nextStep);
  }

  function checkEmail(): boolean {
    setMessage(null);
    if (isAllowedEmail(email)) return true;
    setMessage("Yalnızca @sakarya.edu.tr uzantılı adresle giriş yapabilirsin.");
    return false;
  }

  function finish() {
    router.replace(next);
    router.refresh();
  }

  async function signInWithPassword(e: FormEvent) {
    e.preventDefault();
    if (!checkEmail()) return;
    setBusy(true);
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setMessage("E-posta ya da şifre hatalı.");
      return;
    }
    finish();
  }

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    if (!checkEmail()) return;
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
    go("otp-code");
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
    finish();
  }

  const emailField = (
    <label className="block text-sm font-medium">
      Okul e-postası
      <input
        className={inputClass}
        type="email"
        autoComplete="email"
        placeholder="ad.soyad@sakarya.edu.tr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
    </label>
  );
  const feedback = message && <p className="text-sm text-danger">{message}</p>;

  if (step === "otp-code") {
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
        {feedback}
        <Button type="submit" className="h-11 w-full" disabled={busy}>
          Giriş yap
        </Button>
        <button type="button" onClick={() => go("otp-email")} className={linkClass}>
          E-postayı değiştir
        </button>
      </form>
    );
  }

  if (step === "otp-email") {
    return (
      <form onSubmit={sendCode} className="mt-6 space-y-4">
        {emailField}
        {feedback}
        <Button type="submit" className="h-11 w-full" disabled={busy}>
          Kod gönder
        </Button>
        <button type="button" onClick={() => go("password")} className={linkClass}>
          Şifreyle giriş yap
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={signInWithPassword} className="mt-8 space-y-5">
      {emailField}
      <label className="block text-sm font-medium">
        Şifre
        <input
          className={inputClass}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {feedback}
      <Button type="submit" className="h-11 w-full" disabled={busy}>
        Giriş yap
      </Button>
      <button type="button" onClick={() => go("otp-email")} className={linkClass}>
        Şifren yok mu? E-postana kod gönderelim
      </button>
    </form>
  );
}
