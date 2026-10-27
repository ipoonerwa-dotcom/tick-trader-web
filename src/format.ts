export const usd = (v: number | null | undefined, digits = 2) =>
  v === null || v === undefined || !Number.isFinite(v)
    ? "—"
    : (v < 0 ? "−$" : "$") + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const signedUsd = (v: number | null | undefined, digits = 2) =>
  v === null || v === undefined || !Number.isFinite(v) ? "—" : (v > 0 ? "+" : "") + usd(v, digits);

export const pct = (v: number | null | undefined, digits = 2) =>
  v === null || v === undefined || !Number.isFinite(v) ? "—" : (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(digits) + "%";

export const bp = (v: number | null | undefined) =>
  v === null || v === undefined || !Number.isFinite(v) ? "—" : (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1) + " bp";

export const price = (v: number | null | undefined) =>
  v === null || v === undefined || !Number.isFinite(v) ? "—" : v >= 100 ? v.toFixed(2) : v >= 1 ? v.toFixed(3) : v.toPrecision(4);

export const tone = (v: number | null | undefined) => (!v ? "" : v > 0 ? "up" : "down");

/** Short relative time in the page's language. */
export function ago(t: number, zh: boolean) {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return zh ? `${s} 秒前` : `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return zh ? `${m} 分钟前` : `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return zh ? `${h} 小时前` : `${h}h ago`;
  return zh ? `${Math.round(h / 24)} 天前` : `${Math.round(h / 24)}d ago`;
}

export const clock = (t: number) =>
  new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

/** 18-decimal token amount from a decimal string. */
export function tokenAmount(wei: string | bigint, digits = 4) {
  const v = typeof wei === "bigint" ? wei : BigInt(wei);
  const whole = v / 10n ** 18n;
  const frac = (v % 10n ** 18n).toString().padStart(18, "0").slice(0, digits).replace(/0+$/, "");
  return whole.toLocaleString("en-US") + (frac ? "." + frac : "");
}

export const short = (a: string) => a.slice(0, 6) + "…" + a.slice(-4);
