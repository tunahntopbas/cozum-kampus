"use client";

import { useState, type FormEvent } from "react";
import { Phone, ShieldCheck } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

const EMERGENCY_PHONE = process.env.NEXT_PUBLIC_SECURITY_PHONE || "112";

// Anonymous security channel: security_reports has no reporter column, only the security role can read it.
export function SafetyCard({ location }: { location: string | null }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setState("sending");
    const { error } = await createClient()
      .from("security_reports")
      .insert({ body: body.trim(), location });
    setState(error ? "error" : "sent");
    if (!error) setBody("");
  }

  return (
    <section aria-label="Hassas konular ve acil durum" className="glass flex flex-col gap-4 p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-tint text-ink">
          <ShieldCheck size={20} weight="fill" aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-semibold">Hassas bir konu mu?</h2>
          <p className="text-sm text-muted">
            Taciz, şiddet ya da güvenlik sorunları normal akışa girmez. Doğrudan yetkili birime, kimliğin gizli olarak
            iletilir.
          </p>
        </div>
      </div>

      {state === "sent" ? (
        <p role="status" className="rounded-lg bg-status-cozuldu-bg p-3 text-sm text-status-cozuldu-fg">
          Güvenlik birimine iletildi. Kimliğin kaydedilmedi.
        </p>
      ) : open ? (
        <form onSubmit={send} className="flex flex-col gap-2">
          <label htmlFor="guvenli" className="lbl">
            Ne oldu?
          </label>
          <textarea
            id="guvenli"
            rows={3}
            value={body}
            maxLength={2000}
            onChange={(e) => setBody(e.target.value)}
            className="field rounded-lg border border-input-border bg-white p-3 text-sm text-ink outline-none"
          />
          {state === "error" && <p className="text-sm text-danger">Gönderilemedi. Biraz sonra yeniden dene.</p>}
          <button
            type="submit"
            disabled={state === "sending" || !body.trim()}
            className="btn-ink t rounded-lg border-0 bg-ink px-3 py-2 text-base font-semibold text-white disabled:opacity-50"
          >
            Güvenli kanala gönder
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ghost t rounded-lg border border-input-border bg-white px-3 py-2 text-base font-semibold text-ink"
        >
          Anonim güvenlik kanalını aç
        </button>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-hairline pt-4">
        <p className="text-sm text-muted">Can güvenliği söz konusuysa beklemeden çağır.</p>
        <a
          href={`tel:${EMERGENCY_PHONE}`}
          className="btn-red t flex items-center gap-2 rounded-lg bg-danger px-3 py-2 text-sm font-semibold whitespace-nowrap text-white"
        >
          <Phone size={16} weight="fill" aria-hidden />
          Acil durum
        </a>
      </div>
    </section>
  );
}
