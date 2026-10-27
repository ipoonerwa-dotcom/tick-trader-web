import { useI18n } from "../i18n";
import type { Allocation, AllocStock } from "../api";
import { Panel, Sym } from "./common";
import { ago, signedUsd, tone, usd } from "../format";

/** The ETF's daily closes against its moving average: holding while the solid line is above the dashed one. */
function TrendChart({ series }: { series: AllocStock["series"] }) {
  if (series.length < 2) return <div className="alloc-chart" />;
  const values = series.flatMap(([, c, s]) => (s === null ? [c] : [c, s]));
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const W = 300;
  const H = 90;
  const x = (i: number) => (i / (series.length - 1)) * W;
  const y = (v: number) => H - 4 - ((v - lo) / (hi - lo || 1)) * (H - 8);
  const line = (pick: (r: AllocStock["series"][number]) => number | null) =>
    series
      .map((r, i) => [i, pick(r)] as const)
      .filter(([, v]) => v !== null)
      .map(([i, v], k) => `${k ? "L" : "M"}${x(i).toFixed(1)},${y(v as number).toFixed(1)}`)
      .join("");
  return (
    <svg className="alloc-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={line((r) => r[2])} fill="none" stroke="var(--yellow)" strokeWidth="1.5" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
      <path d={line((r) => r[1])} fill="none" stroke="var(--text)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function IndexAlloc({ data }: { data: Allocation }) {
  const { t, lang } = useI18n();
  const zh = lang === "zh";
  const band = data.bandBps / 100;
  const sub = zh
    ? `量化规则没有机会时，${data.sharePct}% 的资金持有指数代币：ETF 日线收盘在 ${data.maDays} 日均线上方就持有，跌破均线 ${band}% 就换回 USDT。`
    : `When no quant rule has an edge, ${data.sharePct}% of the book holds index tokens: held while the ETF closes above its ${data.maDays}-day average, back to USDT once it closes ${band}% below.`;
  return (
    <Panel
      title={t("alloc.title")}
      sub={sub}
      right={!data.enabled ? <span className="pill off">{t("alloc.disabled")}</span> : undefined}
    >
      <div className="alloc-grid">
        {data.stocks.map((s) => {
          const r = s.regime;
          // The pill shows what is held now; a signal not yet traded waits for the next US session.
          const label = r?.state === "in" ? (s.held ? t("alloc.in") : t("alloc.toBuy")) : s.held ? t("alloc.toSell") : t("alloc.out");
          return (
            <div className="alloc-card" key={s.sym}>
              <div className="alloc-head">
                <Sym s={s.sym} />
                {r && data.enabled && <span className={"pill " + (s.held ? "buy" : "off")}>{label}</span>}
              </div>
              <TrendChart series={s.series} />
              <div className="alloc-legend">
                <span><i className="solid" />{s.underlying}</span>
                <span><i className="dash" />{zh ? `${data.maDays} 日均线` : `${data.maDays}-day average`}</span>
              </div>
              <div className="alloc-meta">
                <div>
                  <span className="k">{zh ? `${s.underlying} 收盘` : `${s.underlying} close`}{r ? ` · ${r.day.slice(5)}` : ""}</span>
                  <b>{r ? r.close.toFixed(2) : "—"}</b>
                </div>
                <div>
                  <span className="k">{zh ? "距均线" : "vs average"}</span>
                  <b className={tone(r?.distBps)}>{r ? `${r.distBps > 0 ? "+" : ""}${(r.distBps / 100).toFixed(1)}%` : "—"}</b>
                </div>
                <div>
                  <span className="k">{zh ? "配置权重" : "Weight"}</span>
                  <b>{Math.round(s.weight * 100)}%</b>
                </div>
                <div>
                  <span className="k">{zh ? "当前持仓" : "Holding"}</span>
                  <b>{s.held ? usd(s.valueUsd, 0) : "—"}</b>
                  {s.held && <small className={"alloc-pnl " + tone(s.pnlUsd)}>{signedUsd(s.pnlUsd)}</small>}
                </div>
              </div>
              {s.held && s.since && <div className="alloc-since">{zh ? `${ago(s.since, zh)}买入` : `bought ${ago(s.since, zh)}`}</div>}
              {r?.stale && <div className="alloc-since">{zh ? "行情数据过旧，暂停调仓" : "Price data is stale; rebalancing paused"}</div>}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
