import { useState } from "react";
import { createPublicClient, createWalletClient, custom, encodePacked, formatEther, http, parseAbi, type Address, type Hex } from "viem";
import { bsc } from "viem/chains";
import { usePoll, type DailyReview, type DividendStats } from "../api";
import { ADDR, CHAIN, STOCK_NAMES } from "../config";
import { useI18n } from "../i18n";
import { Panel } from "./common";
import { usdOf } from "./DividendStats";

const WBNB: Address = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const USDT: Address = "0x55d398326f99059fF775485246999027B3197955";
/** PancakeSwap V3 on BSC (the desk bot quotes and trades through the same two). */
const QUOTER: Address = "0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997";
const ROUTER: Address = "0x1b81D678ffb9C0263b24A97847620C99d213eB14";
const WBNB_USDT_FEES = [100, 500];
const SLIPPAGE_BPS = 200n;

const erc20 = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address, address) view returns (uint256)",
  "function approve(address, uint256) returns (bool)",
]);
const vaultAbi = parseAbi(["function pending(address token, address user) view returns (uint256)", "function claim(address token) returns (uint256)"]);
const quoterAbi = parseAbi([
  "function quoteExactInput(bytes path, uint256 amountIn) returns (uint256 amountOut, uint160[] sqrtPriceX96AfterList, uint32[] initializedTicksCrossedList, uint256 gasEstimate)",
]);
const routerAbi = parseAbi([
  "function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum) params) payable returns (uint256 amountOut)",
]);
const pub = createPublicClient({ chain: bsc, transport: http(CHAIN.rpc) });
const fill = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
const units = (wei: bigint, digits = 6) => Number(formatEther(wei)).toLocaleString("en-US", { maximumFractionDigits: digits });

/** Every WBNB → stock route through the pick's cheap pools: direct, or through USDT. */
function routes(pick: DailyReview["pick"]): Hex[] {
  const out: Hex[] = [];
  for (const p of pick.pools) {
    if (p.quote === "WBNB") out.push(encodePacked(["address", "uint24", "address"], [WBNB, p.fee, pick.token]));
    else for (const f of WBNB_USDT_FEES) out.push(encodePacked(["address", "uint24", "address", "uint24", "address"], [WBNB, f, USDT, p.fee, pick.token]));
  }
  return out;
}

/** The route that gives the most of the stock for `amountIn` WBNB, quoted at the current block. */
async function bestRoute(pick: DailyReview["pick"], amountIn: bigint) {
  const quotes = await Promise.all(
    routes(pick).map((path) =>
      pub
        .simulateContract({ address: QUOTER, abi: quoterAbi, functionName: "quoteExactInput", args: [path, amountIn] })
        .then((r) => ({ path, out: r.result[0] }))
        .catch(() => null),
    ),
  );
  const ok = quotes.filter((q): q is { path: Hex; out: bigint } => !!q && q.out > 0n);
  if (!ok.length) throw new Error("no route");
  return ok.reduce((a, b) => (b.out > a.out ? b : a));
}

const name = (sym: string) => STOCK_NAMES[sym] || "";

/** The small card on the home page. */
export function PickCard() {
  const { t, lang } = useI18n();
  const daily = usePoll<DailyReview | null>("/api/daily", 300_000);
  const d = daily.data;
  return (
    <Panel title={t("pick.title")} right={<a className="muted" href="#/dividends">{t("pick.home")}</a>}>
      {!d ? (
        <div className="empty">{daily.loading ? t("loading") : t("pick.none")}</div>
      ) : (
        <div className="pick">
          <div className="pick-sym">
            <b>{d.pick.sym}</b>
            <span className="muted">{name(d.pick.sym)}</span>
          </div>
          <p>{d.text[lang]?.pickReason || d.text.en.pickReason}</p>
        </div>
      )}
    </Panel>
  );
}

/** The dividends page: today's pick, and claim + swap into it from the visitor's own wallet. */
export function PickSwap() {
  const { t, lang } = useI18n();
  const daily = usePoll<DailyReview | null>("/api/daily", 300_000);
  const stats = usePoll<DividendStats>("/api/dividends/stats", 60_000);
  const [account, setAccount] = useState<Address | null>(null);
  const [pending, setPending] = useState<bigint>(0n);
  const [inWallet, setInWallet] = useState<bigint>(0n);
  const [estimate, setEstimate] = useState<bigint | null>(null);
  const [step, setStep] = useState<"" | "claim" | "approve" | "swap">("");
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState<{ hash: Hex; got: bigint } | null>(null);
  const d = daily.data;

  async function refresh(a: Address, pick: DailyReview["pick"]) {
    const [p, w] = await Promise.all([
      pub.readContract({ address: ADDR.dividendVault, abi: vaultAbi, functionName: "pending", args: [ADDR.token, a] }),
      pub.readContract({ address: WBNB, abi: erc20, functionName: "balanceOf", args: [a] }),
    ]);
    setPending(p);
    setInWallet(w);
    const amount = p > 0n ? p : w;
    setEstimate(amount > 0n ? (await bestRoute(pick, amount).catch(() => null))?.out ?? null : null);
  }

  async function connect() {
    if (!window.ethereum) return setMsg(t("div.noWallet"));
    if (!d) return;
    setMsg("");
    const [a] = (await window.ethereum.request({ method: "eth_requestAccounts" })) as Address[];
    setAccount(a);
    await refresh(a, d.pick);
  }

  async function go() {
    if (!window.ethereum || !account || !d) return;
    setMsg("");
    setDone(null);
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x38" }] });
      const wallet = createWalletClient({ chain: bsc, transport: custom(window.ethereum) });
      const balance = () => pub.readContract({ address: WBNB, abi: erc20, functionName: "balanceOf", args: [account] });
      let amountIn: bigint;
      const owed = await pub.readContract({ address: ADDR.dividendVault, abi: vaultAbi, functionName: "pending", args: [ADDR.token, account] });
      if (owed > 0n) {
        // Only what this claim brings in is swapped; WBNB already in the wallet stays put.
        setStep("claim");
        const before = await balance();
        const h = await wallet.writeContract({ account, address: ADDR.dividendVault, abi: vaultAbi, functionName: "claim", args: [ADDR.token] });
        await pub.waitForTransactionReceipt({ hash: h });
        amountIn = (await balance()) - before;
      } else {
        amountIn = await balance();
      }
      if (amountIn <= 0n) throw new Error(t("pick.nothing"));
      const best = await bestRoute(d.pick, amountIn);
      const allowance = await pub.readContract({ address: WBNB, abi: erc20, functionName: "allowance", args: [account, ROUTER] });
      if (allowance < amountIn) {
        setStep("approve");
        const h = await wallet.writeContract({ account, address: WBNB, abi: erc20, functionName: "approve", args: [ROUTER, amountIn] });
        await pub.waitForTransactionReceipt({ hash: h });
      }
      setStep("swap");
      const stock = () => pub.readContract({ address: d.pick.token, abi: erc20, functionName: "balanceOf", args: [account] });
      const before = await stock();
      const hash = await wallet.writeContract({
        account,
        address: ROUTER,
        abi: routerAbi,
        functionName: "exactInput",
        args: [
          {
            path: best.path,
            recipient: account,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 600),
            amountIn,
            amountOutMinimum: (best.out * (10_000n - SLIPPAGE_BPS)) / 10_000n,
          },
        ],
      });
      await pub.waitForTransactionReceipt({ hash });
      setDone({ hash, got: (await stock()) - before });
      await refresh(account, d.pick);
    } catch (e) {
      setMsg((e as Error).message.split("\n")[0]);
    } finally {
      setStep("");
    }
  }

  if (!d) {
    return (
      <Panel title={t("pick.title")}>
        <div className="empty">{daily.loading ? t("loading") : t("pick.none")}</div>
      </Panel>
    );
  }
  const sym = d.pick.sym;
  const text = d.text[lang] || d.text.en;
  const amount = pending > 0n ? pending : inWallet;
  const label =
    pending > 0n
      ? fill(t("pick.goClaim"), { x: units(pending), sym })
      : inWallet > 0n
        ? fill(t("pick.goWallet"), { x: units(inWallet), sym })
        : t("pick.nothingShort");
  return (
    <Panel title={t("pick.title")} right={<span className="muted">{new Date(d.generatedAt).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US")}</span>} glow>
      <div className="pick">
        <div className="pick-sym">
          <b>{sym}</b>
          <span className="muted">{name(sym)}</span>
        </div>
        <p>{text.pickReason}</p>
      </div>
      <p className="muted" style={{ margin: "4px 0 14px", lineHeight: 1.6 }}>{t("pick.sub")}</p>
      {!account ? (
        <button className="btn primary" onClick={() => connect().catch((e) => setMsg(e.message))}>{t("pick.connect")}</button>
      ) : (
        <>
          <div className="kv">
            <div><span>{t("pick.claimable")}</span><b>{units(pending)} WBNB</b></div>
            <div><span>{t("pick.wallet")}</span><b>{units(inWallet)} WBNB</b></div>
            <div>
              <span>{t("pick.estimate")}</span>
              <b>{estimate !== null ? `${units(estimate, 6)} ${sym}` : "—"}</b>
              {amount > 0n && usdOf(Number(formatEther(amount)), stats.data?.bnbUsd) && <small>{usdOf(Number(formatEther(amount)), stats.data?.bnbUsd)}</small>}
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button className="btn primary" disabled={!!step || amount === 0n} onClick={go}>{step ? { claim: t("pick.step.claim"), approve: t("pick.step.approve"), swap: t("pick.step.swap") }[step] : label}</button>
          </div>
        </>
      )}
      {done && (
        <div className="msg">
          {fill(t("pick.done"), { got: units(done.got, 6), sym })}{" "}
          <a href={`${CHAIN.explorer}/tx/${done.hash}`} target="_blank" rel="noreferrer">BscScan ↗</a>
        </div>
      )}
      {msg && <div className="msg muted">{msg}</div>}
      <div className="notice">{t("pick.note")}</div>
    </Panel>
  );
}

