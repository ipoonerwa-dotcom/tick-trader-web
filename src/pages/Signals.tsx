import { useEffect, useRef, useState } from "react";
import { createWalletClient, custom, getAddress } from "viem";
import { bsc } from "viem/chains";
import { useI18n } from "../i18n";
import { usePoll, type Order, type Signals as SignalsData, type Summary } from "../api";
import { Panel, Sym, reason } from "../components/common";
import { ago, clock, signedUsd, tone, usd } from "../format";
import { API_BASE, LINKS } from "../config";

const TOKEN_KEY = "tt.signals.token";
const SEEN_KEY = "tt.signals.seen";
const NEW_MS = 30 * 60_000;

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string | null) => {
    try {
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch {}
  },
};
const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
const tokens = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** The exact text the server checks (bot/src/access.js). */
const accessMessage = (address: string, issuedAt: string) => `Tick Trader holder access\n\nAddress: ${address}\nIssued at: ${issuedAt}`;

export default function Signals() {
  const { t, lang } = useI18n();
  const zh = lang === "zh";
  const [token, setToken] = useState<string | null>(() => store.get(TOKEN_KEY));
  const [data, setData] = useState<SignalsData | null>(null);
  const [denied, setDenied] = useState<{ balance: number; minTokens: number } | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [alerts, setAlerts] = useState(() => typeof Notification !== "undefined" && Notification.permission === "granted");
  const seen = useRef(Number(store.get(SEEN_KEY) || 0));
  const summary = usePoll<Summary>("/api/summary", 60_000);

  function forget() {
    store.set(TOKEN_KEY, null);
    setToken(null);
    setData(null);
  }

  function alertNew(orders: Order[]) {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    for (const o of orders.slice(0, 3)) {
      const side = o.side === "buy" ? t("side.buy") : t("side.sell");
      new Notification(t("sig.alertTitle"), { body: `${side} ${o.sym} ${usd(o.usd, 0)} · ${reason(o.why, zh)}`, tag: `tick-${o.id}` });
    }
  }

  useEffect(() => {
    if (!token) return;
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/signals?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        const body = await r.json();
        if (!alive) return;
        if (r.status === 401) {
          forget();
          setMsg(t("sig.expired"));
          return;
        }
        if (r.status === 403) {
          forget();
          setDenied({ balance: body.balance, minTokens: body.minTokens });
          return;
        }
        if (!r.ok) throw new Error(body.error || r.statusText);
        const d = body as SignalsData;
        setData(d);
        setMsg("");
        const newest = d.orders[0]?.id ?? 0;
        if (seen.current && newest > seen.current) alertNew(d.orders.filter((o) => o.id > seen.current));
        if (newest > seen.current) {
          seen.current = newest;
          store.set(SEEN_KEY, String(newest));
        }
      } catch {
        if (alive) setMsg(t("offline"));
      }
    };
    load();
    const id = setInterval(load, 10_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function unlock() {
    if (!window.ethereum) return setMsg(t("div.noWallet"));
    setBusy(true);
    setDenied(null);
    setMsg(t("sig.signing"));
    try {
      const [raw] = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const address = getAddress(raw);
      const issued = new Date().toISOString();
      const wallet = createWalletClient({ chain: bsc, transport: custom(window.ethereum) });
      const sig = await wallet.signMessage({ account: address, message: accessMessage(address, issued) });
      const r = await fetch(`${API_BASE}/api/access?${new URLSearchParams({ address, issued, sig })}`, { cache: "no-store" });
      const body = await r.json();
      if (r.status === 403 && body.minTokens) {
        setDenied({ balance: body.balance, minTokens: body.minTokens });
        setMsg("");
        return;
      }
      if (!r.ok) throw new Error(body.error || r.statusText);
      store.set(TOKEN_KEY, body.token);
      setToken(body.token);
      setMsg("");
    } catch (e) {
      setMsg((e as Error).message.split("\n")[0]);
    } finally {
      setBusy(false);
    }
  }

  async function turnOnAlerts() {
    if (typeof Notification === "undefined") return setMsg(t("sig.noNotify"));
    setAlerts((await Notification.requestPermission()) === "granted");
  }

  const min = data?.minTokens ?? denied?.minTokens ?? summary.data?.signalMinTokens ?? 100_000;
  const delay = data?.delayMin ?? summary.data?.delayMin ?? 60;
  return (
    <div className="wrap">
      <section className="section" style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 26, margin: "0 0 8px" }}>{t("sig.title")}</h2>
        <p className="muted" style={{ maxWidth: 760, lineHeight: 1.6 }}>{fill(t("sig.sub"), { min: tokens(min), delay })}</p>
      </section>

      {!data && (
        <section className="section">
          <Panel glow>
            <div className="lookup">
              <button className="btn primary" disabled={busy || !!token} onClick={unlock}>{t("sig.unlock")}</button>
              <a className="btn" href={LINKS.buy} target="_blank" rel="noreferrer">{t("nav.buy")}</a>
            </div>
            <div className="msg muted">{t("sig.signNote")}</div>
            {denied && <div className="msg">{fill(t("sig.denied"), { bal: tokens(denied.balance), min: tokens(denied.minTokens) })}</div>}
            {token && !msg && <div className="msg muted">{t("loading")}</div>}
            {msg && <div className="msg muted">{msg}</div>}
          </Panel>
        </section>
      )}

      {data && (
        <>
          <section className="section">
            <div className="sig-bar">
              <span className="badge"><i />{t("sig.unlocked")}</span>
              <span className="muted">{short(data.holder.address)} · {t("sig.holding")} {tokens(data.holder.balance)} TICK</span>
              <span className="spacer" />
              <button className="btn" onClick={turnOnAlerts} disabled={alerts}>{alerts ? t("sig.notifyOn") : t("sig.notifyOff")}</button>
              <button className="btn" onClick={forget}>{t("sig.signOut")}</button>
            </div>
            <div className="notice">{t("sig.notifyNote")}{msg && ` · ${msg}`}</div>
          </section>

          <section className="section">
            <Panel title={t("sig.feed")} right={<span className="muted">{t("updated")} {ago(data.at, zh)}</span>}>
              {data.orders.length === 0 ? (
                <div className="empty">{t("sig.empty")}</div>
              ) : (
                <div className="sig-list">
                  {data.orders.map((o) => (
                    <div className="sig-item" key={o.id}>
                      <div className="sig-head">
                        <span className={"pill " + (o.side === "buy" ? "buy" : "sell")}>{o.side === "buy" ? t("side.buy") : t("side.sell")}</span>
                        <Sym s={o.sym} />
                        <b>{usd(o.usd, 0)}</b>
                        <span className="muted">@ {o.px.toLocaleString("en-US", { maximumFractionDigits: 4 })}</span>
                        {o.side === "sell" && o.pnlUsd !== undefined && <b className={tone(o.pnlUsd)}>{signedUsd(o.pnlUsd)}</b>}
                        {Date.now() - o.t < NEW_MS && <span className="pill buy">{t("sig.new")}</span>}
                        <span className="spacer" />
                        <span className="muted" title={new Date(o.t).toLocaleString()}>{clock(o.t)} · {ago(o.t, zh)}</span>
                      </div>
                      <div className="sig-why">{reason(o.why, zh)}</div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </section>

          <section className="section grid-2">
            <Panel title={t("sig.positions")}>
              {data.positions.length === 0 ? (
                <div className="empty">{t("desk.positions.empty")}</div>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{t("col.stock")}</th>
                        <th className="num">{t("col.value")}</th>
                        <th className="num">{t("col.pnl")}</th>
                        <th className="num">{t("col.held")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.positions.map((p) => (
                        <tr key={p.sym}>
                          <td><Sym s={p.sym} /></td>
                          <td className="num">{usd(p.valueUsd, 0)}</td>
                          <td className={"num " + tone(p.pnlUsd)}>{signedUsd(p.pnlUsd)}</td>
                          <td className="num muted">{ago(p.openedAt, zh)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
            <Panel title={t("sig.alloc")}>
              <div className="sig-list">
                {data.allocation.stocks.map((s) => {
                  const r = s.regime;
                  const label = r?.state === "in" ? (s.held ? t("alloc.in") : t("alloc.toBuy")) : s.held ? t("alloc.toSell") : t("alloc.out");
                  const pending = (r?.state === "in") !== s.held;
                  return (
                    <div className="sig-head" key={s.sym}>
                      <Sym s={s.sym} />
                      {r && data.allocation.enabled && <span className={"pill " + (pending ? "buy" : s.held ? "buy" : "off")}>{label}</span>}
                      <span className="spacer" />
                      {r && <span className="muted">{s.underlying} {r.distBps >= 0 ? "+" : ""}{r.distBps} bp</span>}
                    </div>
                  );
                })}
              </div>
            </Panel>
          </section>
        </>
      )}
    </div>
  );
}
