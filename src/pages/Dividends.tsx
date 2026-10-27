import { useState } from "react";
import { createPublicClient, createWalletClient, custom, http, parseAbi, type Address, type Hex } from "viem";
import { bsc } from "viem/chains";
import { useI18n } from "../i18n";
import { usePoll, type Claim, type DividendSummary } from "../api";
import { Panel } from "../components/common";
import { ADDR, API_BASE, CHAIN, STOCK_BY_ADDRESS, STOCK_NAMES } from "../config";
import { tokenAmount } from "../format";

declare global {
  interface Window {
    ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
  }
}

const deskAbi = parseAbi([
  "function claimed(address account, address token) view returns (uint256)",
  "function claimMany(address account, address[] tokens, uint256[] cumulatives, bytes32[][] proofs) returns (uint256[])",
]);
const pub = createPublicClient({ chain: bsc, transport: http(CHAIN.rpc) });
const isAddress = (a: string) => /^0x[0-9a-fA-F]{40}$/.test(a.trim());
const symOf = (token: string) => STOCK_BY_ADDRESS[token.toLowerCase()] || token.slice(0, 8);

interface Row {
  token: Address;
  sym: string;
  owed: bigint;
  claimed: bigint;
  claim: Claim;
}

export default function Dividends() {
  const { t } = useI18n();
  const latest = usePoll<DividendSummary | null>(ADDR.desk ? "/api/dividends/latest" : null, 60_000);
  const [input, setInput] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [account, setAccount] = useState<Address | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ADDR.desk) {
    return (
      <div className="wrap">
        <section className="section" style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 26, margin: "0 0 8px" }}>{t("div.title")}</h2>
          <p className="muted" style={{ maxWidth: 760, lineHeight: 1.6 }}>{t("div.sub")}</p>
          <Panel glow>
            <div className="empty" style={{ color: "var(--text)" }}>{t("div.soon")}</div>
          </Panel>
        </section>
      </div>
    );
  }
  const desk = ADDR.desk;

  async function lookup(a: string) {
    setMsg("");
    setRows(null);
    const addr = a.trim().toLowerCase() as Address;
    const r = await fetch(`${API_BASE}/api/dividends/claims/${addr}`, { cache: "no-store" });
    const data = (await r.json()) as { claims: Claim[] } | null;
    const claims = data?.claims || [];
    const out: Row[] = [];
    for (const c of claims) {
      const claimed = await pub.readContract({ address: desk, abi: deskAbi, functionName: "claimed", args: [addr, c.token as Address] });
      out.push({ token: c.token as Address, sym: symOf(c.token), owed: BigInt(c.cumulative), claimed, claim: c });
    }
    setAccount(addr);
    setRows(out);
  }

  async function connect() {
    if (!window.ethereum) return setMsg(t("div.noWallet"));
    const [a] = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
    setInput(a);
    await lookup(a);
  }

  async function claimAll() {
    if (!window.ethereum || !account || !rows) return setMsg(t("div.noWallet"));
    const todo = rows.filter((r) => r.owed > r.claimed);
    if (!todo.length) return;
    setBusy(true);
    setMsg(t("div.claiming"));
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x38" }] });
      const [from] = (await window.ethereum.request({ method: "eth_requestAccounts" })) as Address[];
      const wallet = createWalletClient({ chain: bsc, transport: custom(window.ethereum) });
      const hash = await wallet.writeContract({
        account: from,
        address: desk,
        abi: deskAbi,
        functionName: "claimMany",
        args: [account, todo.map((r) => r.token), todo.map((r) => r.owed), todo.map((r) => r.claim.proof as Hex[])],
      });
      await pub.waitForTransactionReceipt({ hash });
      setMsg(t("div.claimedOk"));
      await lookup(account);
    } catch (e) {
      setMsg((e as Error).message.split("\n")[0]);
    } finally {
      setBusy(false);
    }
  }

  const d = latest.data;
  const claimable = rows?.some((r) => r.owed > r.claimed);
  return (
    <div className="wrap">
      <section className="section" style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 26, margin: "0 0 8px" }}>{t("div.title")}</h2>
        <p className="muted" style={{ maxWidth: 760, lineHeight: 1.6 }}>{t("div.sub")}</p>
      </section>

      <section className="section">
        <Panel title={t("div.latest")}>
          {!d && <div className="empty">{latest.loading ? t("loading") : t("div.soon")}</div>}
          {d && (
            <div className="kv">
              <div><span>{t("div.day")}</span><b>{d.day}</b></div>
              <div><span>{t("div.holders")}</span><b>{d.eligible.length}</b></div>
              <div>
                <span>{t("div.paid")}</span>
                {Object.entries(d.paidToday).map(([tok, amt]) => (
                  <b key={tok} style={{ display: "block" }}>{tokenAmount(amt)} {symOf(tok)}</b>
                ))}
              </div>
              <div>
                <span>{t("div.total")}</span>
                {Object.entries(d.totals).map(([tok, amt]) => (
                  <b key={tok} style={{ display: "block" }}>{tokenAmount(amt)} {symOf(tok)}</b>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </section>

      <section className="section">
        <Panel title={t("div.lookup")}>
          <div className="lookup">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("div.placeholder")} spellCheck={false} />
            <button className="btn" disabled={!isAddress(input)} onClick={() => lookup(input).catch((e) => setMsg(e.message))}>{t("div.check")}</button>
            <button className="btn primary" onClick={() => connect().catch((e) => setMsg(e.message))}>{t("div.connect")}</button>
          </div>
          {rows && rows.length === 0 && <div className="empty">{t("div.none")}</div>}
          {rows && rows.length > 0 && (
            <div className="table-scroll" style={{ marginTop: 14 }}>
              <table>
                <thead>
                  <tr>
                    <th>{t("col.stock")}</th>
                    <th className="num">{t("div.owed")}</th>
                    <th className="num">{t("div.claimed")}</th>
                    <th className="num">{t("div.claimable")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.token}>
                      <td><span className="sym">{r.sym}<small>{STOCK_NAMES[r.sym] || ""}</small></span></td>
                      <td className="num">{tokenAmount(r.owed)}</td>
                      <td className="num muted">{tokenAmount(r.claimed)}</td>
                      <td className="num up">{tokenAmount(r.owed - r.claimed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {claimable && (
            <div style={{ marginTop: 14 }}>
              <button className="btn primary" disabled={busy} onClick={claimAll}>{t("div.claim")}</button>
            </div>
          )}
          {msg && <div className="msg muted">{msg}</div>}
        </Panel>
      </section>
    </div>
  );
}
