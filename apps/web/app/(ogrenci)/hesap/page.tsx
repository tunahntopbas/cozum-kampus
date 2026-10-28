import Link from "next/link";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Role } from "@/lib/auth";
import { initials, roleLabel } from "@/lib/labels";
import { createServerClient, getAuthUser } from "@/lib/supabase/server";
import { ProfileForm } from "./ProfileForm";
import { DeleteAccountButton } from "./DeleteAccountButton";
import { SignOutButton } from "./SignOutButton";

async function Account() {
  const supabase = await createServerClient();
  const user = await getAuthUser(supabase);
  if (!user) return null;

  const [{ data: profile }, reports, votes, resolved] = await Promise.all([
    supabase.from("profiles").select("full_name, student_no, department, language, role").eq("id", user.id).single(),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("reporter_id", user.id),
    supabase.from("report_votes").select("report_id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("reporter_id", user.id)
      .eq("status", "cozuldu"),
  ]);

  const name = profile?.full_name || user.email || "";
  const stats = [
    ["Bildirim", reports.count ?? 0],
    ["Destek", votes.count ?? 0],
    ["Çözüldü", resolved.count ?? 0],
  ] as const;

  return (
    <div className="cols grid grid-cols-[360px_minmax(0,1fr)] items-start gap-4">
      <section aria-label="Profil özeti" className="glass flex flex-col gap-4 p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-[72px] w-[72px] flex-none items-center justify-center rounded-full bg-tint text-2xl font-semibold">
            {initials(name)}
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">{name}</h2>
            {profile?.department && <p className="text-sm text-muted">{profile.department}</p>}
            <span className="pill self-start bg-tint text-ink">{roleLabel((profile?.role ?? "student") as Role)}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {stats.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5 rounded-lg bg-white p-3">
              <p className="mono text-2xl font-semibold">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
        <SignOutButton />
      </section>

      <div className="flex flex-col gap-4">
        <ProfileForm
          profile={{
            id: user.id,
            fullName: profile?.full_name ?? "",
            studentNo: profile?.student_no ?? "",
            department: profile?.department ?? "",
            language: profile?.language ?? "tr",
            email: user.email ?? "",
          }}
        />
        <section
          aria-label="Hesap işlemleri"
          className="glass flex items-center justify-between gap-4 px-6 py-4 max-sm:flex-col max-sm:items-start"
        >
          <div>
            <h2 className="text-sm font-semibold">Hesabı sil</h2>
            <p className="text-xs text-muted">
              Hesabın ve ona bağlı kişisel verilerin kalıcı olarak silinir. Açtığın bildirimler anonim olarak kalır.{" "}
              <Link href="/kvkk" className="text-accent underline-offset-2 hover:underline focus-ring">
                KVKK aydınlatma metni
              </Link>
            </p>
          </div>
          {profile?.role === "student" ? (
            <DeleteAccountButton />
          ) : (
            <p className="max-w-56 flex-none text-xs text-muted">
              Personel ve yönetici hesapları yönetim tarafından kapatılır.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <PageContent>
      <PageHeader title="Hesabım" description="Profil bilgilerin ve hesabınla ilgili işlemler." />
      <Suspense fallback={<PageSkeleton label="Hesabın yükleniyor" variant="form" />}>
        <Account />
      </Suspense>
    </PageContent>
  );
}
