import { Suspense } from "react";
import { Glass } from "@/components/ui/Glass";
import { Logo } from "@/components/ui/Logo";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Glass className="w-full max-w-sm p-8">
        <Logo />
        <h1 className="mt-6 text-xl font-semibold">Giriş yap</h1>
        <p className="mt-1 text-sm text-muted">Okul e-posta adresinle giriş yap.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </Glass>
    </main>
  );
}
