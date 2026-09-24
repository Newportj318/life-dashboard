// Secrets pasted into Vercel or .env.local often pick up a stray space or line break; trim them.
export function secret(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}
