import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in · Life Dashboard" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-content-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
            <svg width={20} viewBox="0 0 50 39" fill="none" className="fill-white" aria-hidden>
              <path d="M16.4992 2H37.5808L22.0816 24.9729H1L16.4992 2Z" />
              <path d="M17.4224 27.102L11.4192 36H33.5008L49 13.0271H32.7024L23.2064 27.102H17.4224Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold">Life Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Log in to continue</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
