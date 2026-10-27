import { useState } from "react";
import { createPublicClient, createWalletClient, custom, formatEther, http, parseAbi, type Address } from "viem";
import { bsc } from "viem/chains";
import { useI18n } from "../i18n";
import { usePoll, type DividendStats, type DividendUser } from "../api";
import { Panel } from "../components/common";
import { DividendNote, DividendStatsRow, usdOf, wbnb } from "../components/DividendStats";
import { PickSwap } from "../components/TodayPick";
import { ADDR, API_BASE, CHAIN } from "../config";

declare global {
  interface Window {
    ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
  }
}

/** GANG's shared dividend vault: the holders' part of the $TICK tax is credited here and claimed in WBNB. */
const vaultAbi = parseAbi([
  "function pending(address token, address user) view returns (uint256)",
  "function shares(address token, address user) view returns (uint256)",
  "function claim(address token) returns (uint256)",
]);
const erc20Abi = parseAbi(["function balanceOf(address) view returns (uint256)"]);
const pub = createPublicClient({ chain: bsc, transport: http(CHAIN.rpc) });
const isAddress = (a: string) => /^0x[0-9a-fA-F]{40}$/.test(a.trim());
const amount = (wei: bigint, digits: number) => Number(formatEther(wei)).toLocaleString("en-US", { maximumFractionDigits: digits });
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

interface Info {
  addr: Address;
  balance: bigint;
  earning: boolean;
  claimable: bigint;
  claimed: number | null;
  estPerDay: number | null;
}

/** What holding N TICK would earn at the last day's rate. */
function Calculator({ s }: { s: DividendStats | null | undefined }) {
  const { t } = useI18n();
  const [hold, setHold] = useState("1,000,000");
  const n = Number(hold.replace(/[,\s_]/g, ""));
  const min = s?.minHolding ?? 10_000;
  const rate = s?.perMillionPerDay ?? null;
  const day = rate !== null && Number.isFinite(n) && n > min ? (n / 1e6) * rate : null;
  return (
    <Panel title={t("calc.title")}>
      <div className="lookup">
        <input value={hold} onChange={(e) => setHold(e.target.value)} inputMode="numeric" placeholder={t("calc.hold")} aria-label={t("calc.hold")} />
      </div>
      {rate === null ? (
        <div className="msg muted">{t("calc.wait")}</div>
      ) : day === null ? (
        <div className="msg muted">{t("calc.min")}</div>
      ) : (
        <div className="kv" style={{ marginTop: 16 }}>
          <div>
            <span>{t("calc.day")}</span>
            <b>{wbnb(day)} WBNB</b>
            {usdOf(day, s?.bnbUsd) && <small>{usdOf(day, s?.bnbUsd)}</small>}
          </div>
          <div>
            <span>{t("calc.month")}</span>
            <b>{wbnb(day * 30)} WBNB</b>
            {usdOf(day * 30, s?.bnbUsd) && <small>{usdOf(day * 30, s?.bnbUsd)}</small>}
          </div>
        </div>
      )}
    </Panel>
  );
}

export default function Dividends() {
  const { t } = useI18n();
  const stats = usePoll<DividendStats>("/api/dividends/stats", 30_000);
  const [input, setInput] = useState("");
  const [info, setInfo] = useState<Info | null>(null);
  const [connected, setConnected] = useState<Address | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function lookup(a: string) {
    setMsg("");
    setInfo(null);
    const addr = a.trim() as Address;
    const [balance, shares, claimable, user] = await Promise.all([
      pub.readContract({ address: ADDR.token, abi: erc20Abi, functionName: "balanceOf", args: [addr] }),
      pub.readContract({ address: ADDR.dividendVault, abi: vaultAbi, functionName: "shares", args: [ADDR.token, addr] }),
      pub.readContract({ address: ADDR.dividendVault, abi: vaultAbi, functionName: "pending", args: [ADDR.token, addr] }),
      fetch(`${API_BASE}/api/dividends/user/${addr.toLowerCase()}`, { cache: "no-store" })
        .then((r) => (r.ok ? (r.json() as Promise<DividendUser>) : null))
        .catch(() => null),
    ]);
    setInfo({ addr, balance, earning: shares > 0n, claimable, claimed: user?.claimedWbnb ?? null, estPerDay: user?.estPerDay ?? null });
  }

  async function connect() {
    if (!window.ethereum) return setMsg(t("div.noWallet"));
    const [a] = (await window.ethereum.request({ method: "eth_requestAccounts" })) as Address[];
    setConnected(a);
    setInput(a);
    await lookup(a);
  }

  async function claim() {
    if (!window.ethereum || !connected) return setMsg(t("div.noWallet"));
    setBusy(true);
    setMsg(t("div.claiming"));
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x38" }] });
      const wallet = createWalletClient({ chain: bsc, transport: custom(window.ethereum) });
      const hash = await wallet.writeContract({ account: connected, address: ADDR.dividendVault, abi: vaultAbi, functionName: "claim", args: [ADDR.token] });
      await pub.waitForTransactionReceipt({ hash });
      setMsg(t("div.claimedOk"));
      await lookup(connected);
    } catch (e) {
      setMsg((e as Error).message.split("\n")[0]);
    } finally {
      setBusy(false);
    }
  }

  const mine = !!info && !!connected && info.addr.toLowerCase() === connected.toLowerCase();
  return (
    <div className="wrap">
      <section className="section" style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 26, margin: "0 0 8px" }}>{t("div.title")}</h2>
        <p className="muted" style={{ maxWidth: 760, lineHeight: 1.6 }}>{t("div.sub")}</p>
      </section>

      <section className="section">
        <DividendStatsRow s={stats.data} />
        <DividendNote s={stats.data} error={stats.error} />
      </section>

      <section className="section">
        <PickSwap />
      </section>

      <section className="section">
        <Calculator s={stats.data} />
      </section>

      <section className="section">
        <Panel title={t("div.lookup")}>
          <div className="lookup">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("div.placeholder")} spellCheck={false} />
            <button className="btn" disabled={!isAddress(input)} onClick={() => lookup(input).catch((e) => setMsg(e.message))}>{t("div.check")}</button>
            <button className="btn primary" onClick={() => connect().catch((e) => setMsg(e.message))}>{t("div.connect")}</button>
          </div>
          {info && (
            <div className="kv" style={{ marginTop: 16 }}>
              <div><span>{t("div.balance")}</span><b>{amount(info.balance, 0)}</b></div>
              <div><span>{t("div.status")}</span><b className={info.earning ? "up" : "muted"}>{info.earning ? t("div.earning") : t("div.notEarning")}</b></div>
              <div><span>{t("div.claimable")}</span><b className="up">{amount(info.claimable, 6)} WBNB</b></div>
              <div><span>{t("div.claimedSum")}</span><b>{wbnb(info.claimed)} WBNB</b></div>
              <div><span>{t("div.estDay")}</span><b>{info.estPerDay !== null ? `${wbnb(info.estPerDay)} WBNB` : "—"}</b>{info.estPerDay === null && info.earning && <small>{t("dstat.wait")}</small>}</div>
            </div>
          )}
          {mine && info.claimable > 0n && (
            <div style={{ marginTop: 14 }}>
              <button className="btn primary" disabled={busy} onClick={claim}>{t("div.claim")}</button>
            </div>
          )}
          {info && !mine && info.claimable > 0n && <div className="msg muted">{t("div.connectToClaim")}</div>}
          {msg && <div className="msg muted">{msg}</div>}
        </Panel>
      </section>

      <section className="section">
        <Panel title={t("div.rules")}>
          <div className="kv">
            <div><span>{t("div.k.tax")}</span><b>1% / 1%</b></div>
            <div><span>{t("div.k.share")}</span><b>0%</b></div>
            <div><span>{t("div.k.min")}</span><b>{t("div.v.min")}</b></div>
            <div><span>{t("div.k.paid")}</span><b>WBNB</b></div>
            <div>
              <span>{t("div.k.vault")}</span>
              <b><a href={`${CHAIN.explorer}/address/${ADDR.dividendVault}`} target="_blank" rel="noreferrer">{short(ADDR.dividendVault)}</a></b>
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}
