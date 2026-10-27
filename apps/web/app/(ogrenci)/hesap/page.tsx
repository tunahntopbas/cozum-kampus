import { Suspense } from "react";
import { Glass } from "@/components/ui/Glass";
import { createServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "./SignOutButton";

async function Profile() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name, student_no, department").eq("id", user.id).single()
    : { data: null };

  const rows = [
    ["Ad soyad", profile?.full_name],
    ["E-posta", user?.email],
    ["Öğrenci numarası", profile?.student_no],
    ["Bölüm", profile?.department],
  ] as const;

  return (
    <dl className="mt-6 divide-y divide-hairline text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between py-3">
          <dt className="text-muted">{label}</dt>
          <dd className="font-medium">{value || "Belirtilmedi"}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function AccountPage() {
  return (
    <main className="flex flex-1 items-start justify-center p-8">
      <Glass className="w-full max-w-xl p-8">
        <h1 className="text-xl font-semibold">Hesabım</h1>
        <Suspense fallback={<p className="mt-6 text-sm text-muted">Yükleniyor</p>}>
          <Profile />
        </Suspense>
        <div className="mt-6">
          <SignOutButton />
        </div>
      </Glass>
    </main>
  );
}
