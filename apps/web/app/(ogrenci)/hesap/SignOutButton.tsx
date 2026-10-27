"use client";

import { useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await createClient().auth.signOut();
        router.replace("/giris");
        router.refresh();
      }}
    >
      <SignOut size={16} />
      Çıkış yap
    </Button>
  );
}
