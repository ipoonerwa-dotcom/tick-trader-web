import { useEffect, useRef, useState } from "react";
import { API_BASE } from "./config";

export interface Summary {
  mode: "paper" | "live";
  startedAt: number;
  capitalUsd: number;
  equityUsd: number;
  pnlUsd: number;
  pnlPct: number;
  realizedUsd: number;
  gasUsd: number;
  trades: number;
  winRate: number | null;
  cashUsd: number;
  exposureUsd: number;
  indexUsd?: number;
  indexRealizedUsd?: number;
  strategyVersion: number;
  at: number;
}

export interface Why {
  code: "dex_below_cex" | "gap_closed" | "take_profit" | "stop_loss" | "timeout" | string;
  gapBps?: number;
  costBps?: number;
  edgeBps?: number;
  devBps?: number;
  pnlBps?: number;
  heldSec?: number;
  moveBps?: number;
  windowSec?: number;
  rsi?: number;
  bollZ?: number | null;
  trendBps?: number;
  cross?: boolean;
  aboveBps?: number;
  bars?: number;
  fromPeakBps?: number;
  underlying?: string;
  close?: number;
  sma?: number;
  distBps?: number;
  maDays?: number;
  reason?: string;
}

export interface Order {
  id: number;
  t: number;
  sym: string;
  side: "buy" | "sell";
  status: string;
  why: Why;
  qty: number;
  px: number;
  usd: number;
  gasUsd?: number;
  pnlUsd?: number;
  pnlBps?: number;
  heldSec?: number;
}

export interface Position {
  sym: string;
  qty: number;
  avgPx: number;
  costUsd: number;
  valueUsd: number;
  pnlUsd: number;
  openedAt: number;
  entry?: string;
}

export interface Regime {
  state: "in" | "out";
  close: number;
  sma: number;
  distBps: number;
  day: string;
  stale: boolean;
}

export interface AllocStock {
  sym: string;
  underlying: string;
  weight: number;
  regime: Regime | null;
  held: boolean;
  valueUsd: number;
  pnlUsd: number;
  since: number | null;
  series: [number, number, number | null][];
}

export interface Allocation {
  enabled: boolean;
  sharePct: number;
  maDays: number;
  bandBps: number;
  weights: Record<string, number>;
  updatedAt: number;
  session: string;
  stocks: AllocStock[];
}

export interface EquityPoint {
  t: number;
  eq: number;
  cash: number;
  pos: number;
}

export interface Market {
  sym: string;
  cexBid: number | null;
  cexAsk: number | null;
  cexMid: number | null;
  dexPxUsd: number | null;
  devBidBps: number | null;
  spreadBps: number | null;
  rsi: number | null;
  trendBps: number | null;
  mom30Bps: number | null;
  costBps: number;
  enabled: boolean;
  quote: string;
  fee: number;
}

export interface Thought {
  t: number;
  kind: string;
  title: string;
  text: string;
  textEn?: string;
  titleEn?: string;
  version?: number;
}

/** Fetches `path` now and every `ms`; keeps the last good answer when a refresh fails. `null` path = idle. */
/** GANG's dividend vault for $TICK, indexed by the desk bot. The rate and APR are null until a full day of trading. */
export interface DividendStats {
  updatedAt: number | null;
  lastError?: string | null;
  reconciled?: boolean;
  block?: number;
  totalWbnb?: number;
  claimedWbnb?: number;
  windowHours?: number;
  windowWbnb?: number;
  wbnbPerDay?: number | null;
  aprPct?: number | null;
  perMillionPerDay?: number | null;
  holders?: number;
  totalShares?: number;
  priceBnb?: number | null;
  mcapBnb?: number | null;
  bnbUsd?: number | null;
  minHolding?: number;
}

export interface DividendUser {
  address: string;
  share: number;
  claimedWbnb: number;
  estPerDay: number | null;
  updatedAt: number | null;
}

export function usePoll<T>(path: string | null, ms = 15_000) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({
    data: null,
    error: null,
    loading: !!path,
  });
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    if (!path) return;
    let timer: ReturnType<typeof setTimeout>;
    const run = async () => {
      try {
        const r = await fetch(API_BASE + path, { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = (await r.json()) as T;
        if (alive.current) setState({ data, error: null, loading: false });
      } catch (e) {
        if (alive.current) setState((s) => ({ ...s, error: (e as Error).message, loading: false }));
      }
      timer = setTimeout(run, ms);
    };
    run();
    return () => {
      alive.current = false;
      clearTimeout(timer);
    };
  }, [path, ms]);
  return state;
}
