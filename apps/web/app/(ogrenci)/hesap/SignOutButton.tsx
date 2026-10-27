"use client";

import { useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="ghost t flex items-center justify-center gap-2 rounded-lg border border-input-border bg-white px-3 py-2 text-base font-semibold text-ink"
      onClick={async () => {
        await createClient().auth.signOut();
        router.replace("/giris");
        router.refresh();
      }}
    >
      <SignOut size={20} aria-hidden />
      Çıkış yap
    </button>
  );
}
