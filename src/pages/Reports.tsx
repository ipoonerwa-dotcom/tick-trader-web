import { useState } from "react";
import { useI18n } from "../i18n";
import { usePoll, type EquityPoint, type Report, type ReportNumbers, type ReportSummary } from "../api";
import { EquityChart, Panel, Stat, Sym, reason } from "../components/common";
import { wbnb } from "../components/DividendStats";
import { clock, signedUsd, tone, usd } from "../format";

const day = (t: number, zh: boolean) => new Date(t).toLocaleDateString(zh ? "zh-CN" : "en-US", { month: "short", day: "numeric" });
const period = (from: number, to: number, zh: boolean) => `${day(from, zh)} – ${day(to, zh)}`;
const pctText = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

function Numbers({ n }: { n: ReportNumbers }) {
  const { t } = useI18n();
  return (
    <div className="stats">
      <Stat k={t("rep.pnl")} v={<>{signedUsd(n.pnlUsd)}<small>{pctText(n.pnlPct)}</small></>} cls={tone(n.pnlUsd)} />
      <Stat k={t("rep.trades")} v={<>{n.trades}<small>{t("rep.closed")} {n.closes}</small></>} />
      <Stat k={t("rep.div")} v={n.dividendsWeekWbnb === null ? "—" : `${wbnb(n.dividendsWeekWbnb)} WBNB`} />
      <Stat k={t("rep.earning")} v={n.earningAddresses ?? n.holders ?? "—"} />
    </div>
  );
}

function Tweet({ text }: { text: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const copy = () =>
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  return (
    <Panel title={t("rep.tweet")} right={<button className="btn" onClick={copy}>{copied ? t("ca.copied") : t("ca.copy")}</button>}>
      <div className="rep-tweet">{text}</div>
    </Panel>
  );
}

function One({ id }: { id: string }) {
  const { t, lang } = useI18n();
  const zh = lang === "zh";
  const res = usePoll<Report>(`/api/reports/${id}`, 300_000);
  const r = res.data;
  if (!r) return <div className="empty">{res.error ? t("offline") : t("loading")}</div>;
  const text = r.text[lang] || r.text.en;
  return (
    <>
      <section className="section" style={{ marginTop: 28 }}>
        <a className="muted" href="#/reports">{t("rep.back")}</a>
        <h2 style={{ fontSize: 26, margin: "12px 0 6px" }}>{text.title}</h2>
        <div className="muted">{period(r.from, r.to, zh)}</div>
        <p style={{ maxWidth: 760, lineHeight: 1.7, marginTop: 14 }}>{text.summary}</p>
      </section>
      <section className="section">
        <Numbers n={r.numbers} />
      </section>
      {r.equity.length > 1 && (
        <section className="section">
          <Panel title={t("rep.equity")}>
            <EquityChart points={r.equity as EquityPoint[]} base={r.numbers.equityStart} />
          </Panel>
        </section>
      )}
      <section className="section">
        <Panel title={t("rep.body")}>
          <div className="rep-body">
            {text.sections.map((s, i) => (
              <div key={i}>
                <h3>{s.heading}</h3>
                {s.body.split(/\n+/).map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            ))}
          </div>
        </Panel>
      </section>
      <section className="section">
        <Panel title={t("rep.tradesT")}>
          {r.trades.length === 0 ? (
            <div className="empty">{t("rep.noTrades")}</div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t("col.time")}</th>
                    <th>{t("col.stock")}</th>
                    <th>{t("col.side")}</th>
                    <th className="num">{t("col.size")}</th>
                    <th className="num">{t("col.pnl")}</th>
                    <th>{t("col.why")}</th>
                  </tr>
                </thead>
                <tbody>
                  {r.trades.map((o, i) => (
                    <tr key={i}>
                      <td className="muted">{clock(o.t)}</td>
                      <td><Sym s={o.sym} /></td>
                      <td><span className={"pill " + (o.side === "buy" ? "buy" : "sell")}>{o.side === "buy" ? t("side.buy") : t("side.sell")}</span></td>
                      <td className="num">{usd(o.usd, 0)}</td>
                      <td className={"num " + tone(o.pnlUsd ?? 0)}>{o.pnlUsd === null ? "—" : signedUsd(o.pnlUsd)}</td>
                      <td className="muted">{o.why ? reason(o.why, zh) : o.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </section>
      <section className="section">
        <Tweet text={text.tweet} />
        <div className="notice">{t("rep.foot").replace("{model}", r.model)}</div>
      </section>
    </>
  );
}

export default function Reports({ id }: { id?: string }) {
  const { t, lang } = useI18n();
  const zh = lang === "zh";
  const list = usePoll<ReportSummary[]>(id ? null : "/api/reports", 300_000);
  if (id) {
    return (
      <div className="wrap">
        <One id={id} />
      </div>
    );
  }
  return (
    <div className="wrap">
      <section className="section" style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 26, margin: "0 0 8px" }}>{t("rep.title")}</h2>
        <p className="muted" style={{ maxWidth: 760, lineHeight: 1.6 }}>{t("rep.sub")}</p>
      </section>
      <section className="section">
        {!list.data ? (
          <div className="empty">{list.error ? t("offline") : t("loading")}</div>
        ) : list.data.length === 0 ? (
          <Panel><div className="empty">{t("rep.empty")}</div></Panel>
        ) : (
          <div className="rep-list">
            {list.data.map((r) => (
              <a className="rep-card" href={`#/reports/${r.id}`} key={r.id}>
                <div className="muted">{period(r.from, r.to, zh)}</div>
                <h3>{r.title[lang] || r.title.en}</h3>
                <p className="muted">{r.summary[lang] || r.summary.en}</p>
                <div className="rep-nums">
                  <span className={tone(r.numbers.pnlUsd)}>{signedUsd(r.numbers.pnlUsd)} ({pctText(r.numbers.pnlPct)})</span>
                  <span>{t("rep.trades")} {r.numbers.trades}</span>
                  {r.numbers.dividendsWeekWbnb !== null && <span>{t("rep.div")} {wbnb(r.numbers.dividendsWeekWbnb)} WBNB</span>}
                  <b>{t("rep.read")}</b>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
