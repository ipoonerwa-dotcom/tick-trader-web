import type { ReactNode } from "react";
import { useI18n } from "../i18n";
import type { EquityPoint, Market, Thought, Why } from "../api";
import { ago, bp, price } from "../format";
import { STOCK_NAMES } from "../config";

export function Panel({ title, sub, right, children, glow }: { title?: ReactNode; sub?: ReactNode; right?: ReactNode; children: ReactNode; glow?: boolean }) {
  return (
    <div className={"panel" + (glow ? " glow" : "")}>
      {(title || right) && (
        <div className="panel-head">
          <div>
            {title && <h3>{title}</h3>}
            {sub && <p>{sub}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function Stat({ k, v, cls }: { k: ReactNode; v: ReactNode; cls?: string }) {
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className={"v " + (cls || "")}>{v}</div>
    </div>
  );
}

export function PaperBadge() {
  const { t } = useI18n();
  return (
    <span className="badge">
      <i />
      {t("paper")}
    </span>
  );
}

export function Sym({ s }: { s: string }) {
  return (
    <span className="sym">
      {s}
      <small>{STOCK_NAMES[s] || ""}</small>
    </span>
  );
}

/** Why an order was placed, in the page's language (the bot records the numbers, not the sentence). */
export function reason(w: Why | undefined, zh: boolean) {
  if (!w) return "";
  const r = (x?: number) => Math.round(x ?? 0);
  switch (w.code) {
    case "dex_below_cex":
      return zh
        ? `链上比币安买一价便宜 ${r(w.gapBps)}bp，扣掉来回成本 ${r(w.costBps)}bp 还剩 ${r(w.edgeBps)}bp，买入`
        : `On-chain ${r(w.gapBps)} bp under the Binance bid; ${r(w.edgeBps)} bp left after ${r(w.costBps)} bp of costs — buy`;
    case "lead_lag":
      return zh
        ? `币安 ${r(w.windowSec)} 秒内涨了 ${r(w.moveBps)}bp，链上还没跟上（对买一价差 ${r(w.devBps)}bp），买入`
        : `Binance rose ${r(w.moveBps)} bp in ${r(w.windowSec)} s and the DEX has not followed (${r(w.devBps)} bp vs the bid) — buy`;
    case "rsi_oversold":
      return zh
        ? `RSI ${r(w.rsi)} 超卖，链上对买一价差 ${r(w.devBps)}bp，买入`
        : `RSI ${r(w.rsi)} oversold, DEX ${r(w.devBps)} bp vs the Binance bid — buy`;
    case "rsi_high":
      return zh ? `RSI ${r(w.rsi)} 过热，浮盈 ${r(w.pnlBps)}bp，卖出` : `RSI ${r(w.rsi)} overheated, up ${r(w.pnlBps)} bp — sell`;
    case "downtrend":
      return zh ? `均线转弱，卖出` : `Trend turned down — sell`;
    case "sw_trend":
      return zh
        ? `波段：均线${w.cross ? "金叉" : "向上"}（快线高出 ${r(w.trendBps)}bp），买入持有`
        : `Swing: trend ${w.cross ? "just crossed up" : "up"} (fast EMA ${r(w.trendBps)} bp above slow) — buy and hold`;
    case "sw_breakout":
      return zh
        ? `波段：突破过去 ${r(w.bars)} 根 K 线高点 ${r(w.aboveBps)}bp，买入持有`
        : `Swing: broke ${r(w.aboveBps)} bp above the ${r(w.bars)}-bar high — buy and hold`;
    case "sw_dip":
      return zh ? `波段：上升趋势中 RSI 回落到 ${r(w.rsi)}，逢低买入` : `Swing: RSI dipped to ${r(w.rsi)} inside an uptrend — buy the dip`;
    case "trail_stop":
      return zh
        ? `移动止损：从最高点回撤 ${r(-(w.fromPeakBps ?? 0))}bp，卖出（盈亏 ${r(w.pnlBps)}bp）`
        : `Trailing stop: ${r(-(w.fromPeakBps ?? 0))} bp off the high — sell (${r(w.pnlBps)} bp)`;
    case "trend_reversal":
      return zh ? `均线死叉，波段结束，卖出（盈亏 ${r(w.pnlBps)}bp）` : `Trend crossed down, swing over — sell (${r(w.pnlBps)} bp)`;
    case "alloc_in":
      return zh
        ? `指数配置：${w.underlying} 收盘 ${w.close} 高于 ${r(w.maDays)} 日均线 ${r(w.distBps)}bp，趋势向上，买入持有`
        : `Index: ${w.underlying} closed ${r(w.distBps)} bp above its ${r(w.maDays)}-day average — trend up, buy and hold`;
    case "alloc_out":
      if (w.reason === "off") return zh ? "指数配置已关闭，卖出换回 USDT" : "Index allocation switched off — back to USDT";
      return zh
        ? `指数配置：${w.underlying} 收盘跌破 ${r(w.maDays)} 日均线（${r(w.distBps)}bp），趋势转弱，换回 USDT`
        : `Index: ${w.underlying} closed ${r(-(w.distBps ?? 0))} bp below its ${r(w.maDays)}-day average — trend down, back to USDT`;
    case "gap_closed":
      return zh ? `价差收敛到 ${r(w.devBps)}bp，浮盈 ${r(w.pnlBps)}bp，卖出` : `Gap closed to ${r(w.devBps)} bp, up ${r(w.pnlBps)} bp — sell`;
    case "take_profit":
      return zh ? `止盈：浮盈 ${r(w.pnlBps)}bp` : `Take profit at +${r(w.pnlBps)} bp`;
    case "stop_loss":
      return zh ? `止损：浮亏 ${r(-(w.pnlBps ?? 0))}bp` : `Stop loss at −${r(-(w.pnlBps ?? 0))} bp`;
    case "timeout":
      return zh ? `持仓 ${r((w.heldSec ?? 0) / 60)} 分钟到时，卖出` : `Held ${r((w.heldSec ?? 0) / 60)} min — time's up, sell`;
    default:
      return w.code;
  }
}

export function EquityChart({ points, base }: { points: EquityPoint[]; base: number }) {
  if (points.length < 2) return <div className="empty">—</div>;
  const W = 1000;
  const H = 240;
  const vals = points.map((p) => p.eq);
  let lo = Math.min(...vals, base);
  let hi = Math.max(...vals, base);
  const pad = Math.max((hi - lo) * 0.12, base * 0.0005);
  lo -= pad;
  hi += pad;
  const t0 = points[0].t;
  const t1 = points[points.length - 1].t;
  const x = (t: number) => ((t - t0) / Math.max(1, t1 - t0)) * W;
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.eq).toFixed(1)}`).join(" ");
  const last = vals[vals.length - 1];
  const color = last >= base ? "#FFD23F" : "#FF4D6D";
  return (
    <div style={{ position: "relative" }}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="equity curve">
        <defs>
          <linearGradient id="eqfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity=".22" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" x2={W} y1={y(base)} y2={y(base)} stroke="rgba(255,255,255,.18)" strokeDasharray="6 6" vectorEffect="non-scaling-stroke" />
        <path d={`${line} L${W},${H} L0,${H} Z`} fill="url(#eqfill)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="muted mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 6 }}>
        <span>{new Date(t0).toLocaleString()}</span>
        <span>{new Date(t1).toLocaleString()}</span>
      </div>
    </div>
  );
}

export function MarketsTable({ markets, limit }: { markets: Market[]; limit?: number }) {
  const { t } = useI18n();
  const rows = limit ? [...markets].filter((m) => m.enabled).slice(0, limit) : markets;
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>{t("markets.sym")}</th>
            {!limit && <th className="num">{t("markets.binance")}</th>}
            {!limit && <th className="num">RSI</th>}
            {!limit && <th className="num">{t("markets.mom30")}</th>}
            <th className="num">{t("markets.chain")}</th>
            <th className="num">{t("markets.gap")}</th>
            <th className="num">{t("markets.cost")}</th>
            {!limit && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.sym}>
              <td><Sym s={m.sym} /></td>
              {!limit && <td className="num">{price(m.cexBid)} / {price(m.cexAsk)}</td>}
              {!limit && <td className="num muted">{m.rsi === null ? "—" : m.rsi.toFixed(0)}</td>}
              {!limit && <td className={"num " + (m.mom30Bps ? (m.mom30Bps > 0 ? "up" : "down") : "")}>{bp(m.mom30Bps)}</td>}
              <td className="num">{price(m.dexPxUsd)}</td>
              <td className={"num " + (m.devBidBps !== null && m.devBidBps < -m.costBps ? "up" : "")}>{bp(m.devBidBps)}</td>
              <td className="num muted">{m.costBps} bp</td>
              {!limit && <td><span className={"pill " + (m.enabled ? "buy" : "off")}>{m.enabled ? t("markets.on") : t("markets.off")}</span></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Thoughts({ items }: { items: Thought[] }) {
  const { t, lang } = useI18n();
  const zh = lang === "zh";
  if (!items.length) return <div className="empty">{t("thoughts.empty")}</div>;
  return (
    <div className="thoughts">
      {items.map((x) => (
        <div className="thought" key={x.t}>
          <b>{(!zh && x.titleEn) || x.title}{x.version ? ` · v${x.version}` : ""}</b>
          <div className="meta">{x.kind === "daily" && <span className="pill buy" style={{ marginRight: 8 }}>{t("thoughts.daily")}</span>}{ago(x.t, zh)}</div>
          <p>{(!zh && x.textEn) || x.text}</p>
        </div>
      ))}
    </div>
  );
}
