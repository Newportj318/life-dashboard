// Number formatting shared by server pages and client charts (keep this file free of server-only imports).

export const money = (v: number, opts: { cents?: boolean } = {}) =>
  v.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  });

/** "$587K", "$1.2M" for axes and tight spaces. */
export const compactMoney = (v: number) =>
  v.toLocaleString("en-AU", { style: "currency", currency: "AUD", notation: "compact", maximumFractionDigits: 1 });
