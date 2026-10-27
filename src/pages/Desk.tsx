import { useState } from "react";
import { useI18n } from "../i18n";
import { usePoll, type Allocation, type EquityPoint, type Market, type Order, type Position, type Summary, type Thought } from "../api";
import { IndexAlloc } from "../components/IndexAlloc";
import { EquityChart, MarketsTable, PaperBadge, Panel, Stat, Sym, Thoughts, reason } from "../components/common";
import { ago, clock, pct, price, signedUsd, tone, usd } from "../format";

const RANGES = ["1h", "24h", "7d", "30d"] as const;

export default function Desk() {
  const { t, lang } = useI18n();
  const zh = lang === "zh";
  const [range, setRange] = useState<(typeof RANGES)[number]>("24h");
  const summary = usePoll<Summary>("/api/summary", 10_000);
  const equity = usePoll<EquityPoint[]>(`/api/equity?range=${range}`, 60_000);
  const positions = usePoll<Position[]>("/api/positions", 10_000);
  const orders = usePoll<Order[]>("/api/orders?limit=100", 10_000);
  const markets = usePoll<Market[]>("/api/markets", 10_000);
  const thoughts = usePoll<Thought[]>("/api/thoughts?limit=20", 60_000);
  const allocation = usePoll<Allocation>("/api/allocation", 60_000);
  const s = summary.data;
  const offline = summary.error && !s;

  return (
    <div className="wrap">
      <section className="section" style={{ marginTop: 36 }}>
        <div className="panel-head">
          <div>
            <h2 style={{ fontSize: 26 }}>{t("desk.title")}</h2>
            <div className="notice"><PaperBadge /></div>
          </div>
          {s && <span className="muted mono" style={{ fontSize: 12 }}>{t("updated")} {ago(s.at, zh)}</span>}
        </div>
        {offline && <div className="notice">{t("offline")}</div>}
        <div className="stats">
          <Stat k={t("stats.equity")} v={s ? usd(s.equityUsd) : "—"} />
          <Stat k={t("stats.pnl")} v={s ? <>{signedUsd(s.pnlUsd)}<small>{pct(s.pnlPct)}</small></> : "—"} cls={tone(s?.pnlUsd)} />
          <Stat k={t("desk.realized")} v={s ? signedUsd(s.realizedUsd) : "—"} cls={tone(s?.realizedUsd)} />
          <Stat k={t("stats.win")} v={s && s.winRate !== null ? `${(s.winRate * 100).toFixed(0)}% · ${s.trades}` : "—"} />
          <Stat k={t("desk.cash")} v={s ? usd(s.cashUsd, 0) : "—"} />
          <Stat k={t("desk.exposure")} v={s ? usd(s.exposureUsd, 0) : "—"} />
          <Stat k={t("desk.index")} v={s ? usd(s.indexUsd ?? 0, 0) : "—"} />
          <Stat k={t("desk.gas")} v={s ? usd(s.gasUsd) : "—"} />
        </div>
      </section>

      <section className="section">
        <Panel
          title={t("desk.curve")}
          right={
            <div className="ranges">
              {RANGES.map((r) => (
                <button key={r} className={r === range ? "on" : ""} onClick={() => setRange(r)}>
                  {t(`range.${r}` as "range.1h")}
                </button>
              ))}
            </div>
          }
        >
          {equity.data && s ? <EquityChart points={equity.data} base={s.capitalUsd} /> : <div className="empty">{t("loading")}</div>}
        </Panel>
      </section>

      {allocation.data && (
        <section className="section">
          <IndexAlloc data={allocation.data} />
        </section>
      )}

      <section className="section grid-2">
        <Panel title={t("desk.orders")}>
          {orders.data && orders.data.length === 0 && <div className="empty">{t("desk.orders.empty")}</div>}
          {orders.data && orders.data.length > 0 && (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t("col.time")}</th>
                    <th>{t("col.stock")}</th>
                    <th>{t("col.side")}</th>
                    <th className="num">{t("col.size")}</th>
                    <th className="num">{t("col.price")}</th>
                    <th className="num">{t("col.pnl")}</th>
                    <th>{t("col.why")}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.data.map((o) => (
                    <tr key={o.id}>
                      <td className="muted mono" style={{ fontSize: 12 }}>{clock(o.t)}</td>
                      <td><Sym s={o.sym} /></td>
                      <td><span className={"pill " + o.side}>{t(`side.${o.side}` as "side.buy")}</span></td>
                      <td className="num">{usd(o.usd, 0)}</td>
                      <td className="num">{price(o.px)}</td>
                      <td className={"num " + tone(o.pnlUsd)}>{o.pnlUsd === undefined ? "" : signedUsd(o.pnlUsd)}</td>
                      <td className="why">{reason(o.why, zh)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!orders.data && <div className="empty">{t("loading")}</div>}
        </Panel>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <Panel title={t("desk.positions")}>
            {positions.data && positions.data.length === 0 && <div className="empty">{t("desk.positions.empty")}</div>}
            {positions.data && positions.data.length > 0 && (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{t("col.stock")}</th>
                      <th className="num">{t("col.cost")}</th>
                      <th className="num">{t("col.value")}</th>
                      <th className="num">{t("col.pnl")}</th>
                      <th className="num">{t("col.held")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.data.map((p) => (
                      <tr key={p.sym}>
                        <td>
                          <Sym s={p.sym} />
                          {p.entry === "alloc_in" && <span className="pill off tag-index">{t("alloc.tag")}</span>}
                        </td>
                        <td className="num">{usd(p.costUsd)}</td>
                        <td className="num">{usd(p.valueUsd)}</td>
                        <td className={"num " + tone(p.pnlUsd)}>{signedUsd(p.pnlUsd)}</td>
                        <td className="num muted">{ago(p.openedAt, zh)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!positions.data && <div className="empty">{t("loading")}</div>}
          </Panel>
          <Panel title={t("thoughts.title")}>
            {thoughts.data ? <Thoughts items={thoughts.data} /> : <div className="empty">{t("loading")}</div>}
          </Panel>
        </div>
      </section>

      <section className="section">
        <Panel title={t("markets.title")} sub={t("markets.sub")}>
          {markets.data ? <MarketsTable markets={markets.data} /> : <div className="empty">{t("loading")}</div>}
        </Panel>
      </section>
    </div>
  );
}
