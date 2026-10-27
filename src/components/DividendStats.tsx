import type { DividendStats } from "../api";
import { ago } from "../format";
import { useI18n } from "../i18n";
import { Stat } from "./common";

export const wbnb = (v: number | null | undefined) =>
  v === null || v === undefined ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: v >= 1 ? 4 : 6 });

export const usdOf = (v: number | null | undefined, bnbUsd: number | null | undefined) =>
  v === null || v === undefined || !bnbUsd
    ? null
    : `≈ $${(v * bnbUsd).toLocaleString("en-US", { maximumFractionDigits: v * bnbUsd >= 100 ? 0 : 2 })}`;

/** Behind by more than 10 minutes, or the last round failed: say so instead of passing old numbers off as live. */
export const isStale = (s: DividendStats | null | undefined) => !s?.updatedAt || !!s.lastError || Date.now() - s.updatedAt > 10 * 60_000;

/** The four headline numbers. The daily rate and the APR wait for a full day of trading. */
export function DividendStatsRow({ s }: { s: DividendStats | null | undefined }) {
  const { t } = useI18n();
  const wait = <small>{t("dstat.wait")}</small>;
  const totalUsd = usdOf(s?.totalWbnb, s?.bnbUsd);
  const dayUsd = usdOf(s?.wbnbPerDay, s?.bnbUsd);
  return (
    <div className="stats">
      <Stat k={t("dstat.total")} v={<>{wbnb(s?.totalWbnb)} WBNB{totalUsd && <small>{totalUsd}</small>}</>} />
      <Stat k={t("dstat.perDay")} v={s?.wbnbPerDay != null ? <>{wbnb(s.wbnbPerDay)} WBNB{dayUsd && <small>{dayUsd}</small>}</> : <>—{wait}</>} />
      <Stat
        k={t("dstat.apr")}
        v={s?.aprPct != null ? `${s.aprPct.toLocaleString("en-US", { maximumFractionDigits: s.aprPct >= 100 ? 0 : 1 })}%` : <>—{wait}</>}
        cls={s?.aprPct != null ? "up" : ""}
      />
      <Stat
        k={t("dstat.holders")}
        v={<>{s?.holders ?? "—"}{s?.claimedWbnb != null && <small>{t("dstat.claimed")} {wbnb(s.claimedWbnb)} WBNB</small>}</>}
      />
    </div>
  );
}

/** One line under the numbers: how they are estimated and when, or that the data is behind. */
export function DividendNote({ s, error }: { s: DividendStats | null | undefined; error?: string | null }) {
  const { t, lang } = useI18n();
  if (!s) return error ? <div className="notice">{t("offline")}</div> : null;
  if (isStale(s)) return <div className="notice">{t("dstat.stale")}</div>;
  const basis = s.wbnbPerDay != null ? t("dstat.basis") : t("dstat.young").replace("{h}", String(s.windowHours ?? 0));
  return (
    <div className="notice">
      {basis} · {t("updated")} {ago(s.updatedAt as number, lang === "zh")}
    </div>
  );
}
