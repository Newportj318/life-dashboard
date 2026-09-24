// Calendar days in your timezone. APIs return UTC timestamps and Vercel runs in UTC,
// so every "which day was this?" question goes through here.

export const TIMEZONE = process.env.APP_TIMEZONE || "Australia/Brisbane";

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "YYYY-MM-DD" for a timestamp, in TIMEZONE. */
export function localDay(date: Date | string): string {
  return dayFormatter.format(typeof date === "string" ? new Date(date) : date);
}

export function today(): string {
  return localDay(new Date());
}

// Day strings are handled as UTC midnight so adding days never hits DST edges.
function parse(day: string) {
  return new Date(`${day}T00:00:00Z`);
}

export function addDays(day: string, n: number): string {
  const d = parse(day);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing `day`. */
export function weekStart(day: string): string {
  const dow = (parse(day).getUTCDay() + 6) % 7; // Mon = 0
  return addDays(day, -dow);
}

export function weekDays(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isDay(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(parse(value).getTime());
}

/** Unix seconds for local midnight at the start of `day`. */
export function dayStartUnix(day: string): number {
  // Find the UTC offset for that day in TIMEZONE, then shift UTC midnight by it.
  const utcMidnight = parse(day);
  const asLocal = new Date(utcMidnight.toLocaleString("en-US", { timeZone: TIMEZONE }));
  const asUtc = new Date(utcMidnight.toLocaleString("en-US", { timeZone: "UTC" }));
  return Math.floor((utcMidnight.getTime() - (asLocal.getTime() - asUtc.getTime())) / 1000);
}

export function formatDay(day: string, opts: Intl.DateTimeFormatOptions) {
  return parse(day).toLocaleDateString("en-AU", { timeZone: "UTC", ...opts });
}
