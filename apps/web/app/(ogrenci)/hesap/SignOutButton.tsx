"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      router.replace("/giris");
      router.refresh();
    } catch {
      setError("Çıkış yapılamadı. Lütfen tekrar dene.");
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        className="ghost t flex items-center justify-center gap-2 rounded-lg border border-input-border bg-white px-3 py-2 text-base font-semibold text-ink disabled:opacity-50"
        onClick={signOut}
      >
        <SignOut size={20} aria-hidden />
        {busy ? "Çıkış yapılıyor…" : "Çıkış yap"}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
