import { useI18n } from "../i18n";
import { usePoll, type Market, type Summary, type Thought } from "../api";
import { MarketsTable, PaperBadge, Panel, Stat, Thoughts } from "../components/common";
import { pct, signedUsd, tone, usd } from "../format";
import { ADDR, LINKS } from "../config";

export default function Home() {
  const { t } = useI18n();
  const summary = usePoll<Summary>("/api/summary", 15_000);
  const markets = usePoll<Market[]>("/api/markets", 10_000);
  const thoughts = usePoll<Thought[]>("/api/thoughts?limit=3", 60_000);
  const s = summary.data;

  return (
    <div className="wrap">
      <section className="hero">
        <div>
          <h1>
            <span>TICK</span>
            <br />
            TRADER
          </h1>
          <p className="tagline">{t("hero.tagline")}</p>
          <p className="sub">{t("hero.sub")}</p>
          <div className="ctas">
            <a className="btn primary" href={LINKS.buy} target="_blank" rel="noreferrer">{ADDR.token ? t("nav.buy") : t("nav.soon")}</a>
            <a className="btn" href="#/desk">{t("hero.cta.desk")}</a>
            <a className="btn" href="#/dividends">{t("hero.cta.div")}</a>
          </div>
        </div>
        <Panel glow title={t("markets.title")} right={<span className="badge"><i />LIVE</span>}>
          {markets.data ? <MarketsTable markets={markets.data} limit={6} /> : <div className="empty">{markets.error ? t("offline") : t("loading")}</div>}
        </Panel>
      </section>

      <section className="section">
        <div className="stats">
          <Stat k={t("stats.equity")} v={s ? usd(s.equityUsd, 0) : "—"} />
          <Stat k={t("stats.pnl")} v={s ? <>{signedUsd(s.pnlUsd)}<small>{pct(s.pnlPct)}</small></> : "—"} cls={tone(s?.pnlUsd)} />
          <Stat k={t("stats.trades")} v={s ? s.trades : "—"} />
          <Stat k={t("stats.win")} v={s && s.winRate !== null ? `${(s.winRate * 100).toFixed(0)}%` : "—"} />
        </div>
        {s?.mode === "paper" && <div className="notice"><PaperBadge /></div>}
      </section>

      <section className="section">
        <h2 style={{ fontSize: 20, margin: "0 0 14px" }}>{t("flow.title")}</h2>
        <div className="flow">
          {[1, 2].map((n) => (
            <div className="step" key={n}>
              <b><span>0{n}</span>{t(`flow.${n}.t` as "flow.1.t")}</b>
              <p>{t(`flow.${n}.d` as "flow.1.d")}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <Panel title={t("thoughts.title")} right={<a className="muted" href="#/desk">→</a>}>
          {thoughts.data ? <Thoughts items={thoughts.data} /> : <div className="empty">{thoughts.error ? t("offline") : t("loading")}</div>}
        </Panel>
      </section>
    </div>
  );
}
