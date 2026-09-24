"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "@/app/actions/auth";

const inputCls =
  "w-full rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-gray-950 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, null);

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
        <input name="email" type="email" autoComplete="email" required className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</span>
        <input name="password" type="password" autoComplete="current-password" required className={inputCls} />
      </label>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_-10px_rgb(139_92_246_/_0.8)] hover:brightness-110 disabled:opacity-60 transition"
      >
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
