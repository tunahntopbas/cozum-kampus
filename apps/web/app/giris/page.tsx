import { Suspense } from "react";
import { Stage } from "@/components/layout/Stage";
import { Glass } from "@/components/ui/Glass";
import { Logo } from "@/components/ui/Logo";
import { LoginForm } from "./LoginForm";

// No design exists for the login screen yet (docs/PROJE_REHBERI.md 14); it reuses the stage and glass panel.
export default function LoginPage() {
  return (
    <div className="app relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-map-bg p-4">
      <Stage />
      <main id="icerik" className="relative z-[3] w-full max-w-sm">
        <Glass className="p-8">
          <Logo />
          <h1 className="mt-6 text-xl font-semibold">Giriş yap</h1>
          <p className="mt-1 text-sm text-muted">Okul e-posta adresinle giriş yap.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </Glass>
      </main>
    </div>
  );
}
