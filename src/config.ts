const env = import.meta.env;

/** Base URL of the desk bot's API; empty means same origin (/api). */
export const API_BASE = (env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") || "";

export const CHAIN = {
  id: 56,
  rpc: (env.VITE_RPC as string | undefined) || "https://bsc-dataseed.bnbchain.org",
  explorer: "https://bscscan.com",
};

const addr = (v: unknown) => (typeof v === "string" && /^0x[0-9a-fA-F]{40}$/.test(v) ? (v as `0x${string}`) : null);

/** Contract addresses, set once deployed. Until then the site says so instead of showing empty numbers. */
export const ADDR = {
  token: addr(env.VITE_TICK_TOKEN),
  vault: addr(env.VITE_VAULT),
  desk: addr(env.VITE_DESK),
};

export const LINKS = {
  gang: "https://gang.fun",
  buy: (env.VITE_BUY_URL as string | undefined) || "https://gang.fun",
  x: (env.VITE_X_URL as string | undefined) || "",
};

export const STOCK_NAMES: Record<string, string> = {
  NVDAB: "NVIDIA", SPCXB: "SpaceX", QQQB: "Nasdaq-100 ETF", SPYB: "S&P 500 ETF", BNCB: "CEA Industries",
  TSLAB: "Tesla", BABAB: "Alibaba", GOOGLB: "Alphabet", AAPLB: "Apple", CRCLB: "Circle", MSFTB: "Microsoft",
  GMEB: "GameStop", MSTRB: "Strategy", AMZNB: "Amazon", METAB: "Meta", NFLXB: "Netflix", INTCB: "Intel",
  TSMB: "TSMC", HOODB: "Robinhood", BMNRB: "BitMine",
};

/** Genuine Binance bStocks (same beacon as SPCXB), lower-case address → symbol: dividends are paid in these. */
export const STOCK_BY_ADDRESS: Record<string, string> = {
  "0x02fca66c1d1afb4e2a7884261eb00f63598a7436": "NVDAB",
  "0xbe9d156892e55e7154bcd3cb0fea677f9d3103e1": "SPCXB",
  "0x205812cdbed920aff76c6580abd681a46d11efc7": "QQQB",
  "0x7138b48df7d98d7e3cc221bfe7192d0a178182d8": "SPYB",
  "0x4902c5ebc598265ed2212b559b042de8a5eeec3f": "BNCB",
  "0x5b1910eaad6450e50f816082aa078c41f10c292f": "TSLAB",
  "0x4ef9d3062c7f6eba4aae4990c5036598c6eff4ec": "BABAB",
  "0x3f53de71c126bdabae20f9cd64848d317f6c3238": "GOOGLB",
  "0x431a3bee82e2ca41e49895cbece5bb0f76a89b7a": "AAPLB",
  "0x80f3d493ebce97e343c53d29a137942416b4ffc0": "CRCLB",
};
