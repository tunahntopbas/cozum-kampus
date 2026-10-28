"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const danger =
  "flex-none rounded-lg border border-[#FECACA] bg-white px-3 py-2 text-sm font-semibold text-[#991B1B] disabled:opacity-60";

export function DeleteAccountButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("delete_my_account");
      if (error) throw error;
      // The user row is gone; clearing the local session can fail harmlessly.
      await supabase.auth.signOut().catch(() => undefined);
      router.replace("/giris");
      router.refresh();
    } catch {
      setError("Hesap silinemedi. Lütfen tekrar dene.");
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button type="button" className={danger} onClick={() => setConfirming(true)}>
        Hesabımı ve verilerimi sil
      </button>
    );
  }
  return (
    <div className="flex flex-none flex-col items-end gap-2 max-sm:items-start">
      <p className="text-xs font-semibold text-[#991B1B]">Bu işlem geri alınamaz.</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm font-semibold text-ink disabled:opacity-50"
          onClick={() => setConfirming(false)}
        >
          Vazgeç
        </button>
        <button type="button" disabled={busy} className={`${danger} !bg-[#991B1B] !text-white`} onClick={remove}>
          {busy ? "Siliniyor…" : "Evet, kalıcı olarak sil"}
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
