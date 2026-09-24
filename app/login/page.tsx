import type { Metadata } from "next";
import { AppBackground } from "@/components/app-background";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in · Life Dashboard" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 text-gray-900 dark:text-gray-100">
      <AppBackground />
      <div className="surface rise w-full max-w-sm p-8">
        <div className="mb-8 flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="font-display text-lg font-semibold tracking-tight">Life Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Log in to continue</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
