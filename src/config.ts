const env = import.meta.env;

/** Base URL of the desk bot's API; empty means same origin (/api). */
export const API_BASE = (env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") || "";

export const CHAIN = {
  id: 56,
  rpc: (env.VITE_RPC as string | undefined) || "https://bsc-dataseed.bnbchain.org",
  explorer: "https://bscscan.com",
};

const addr = (v: unknown) => (typeof v === "string" && /^0x[0-9a-fA-F]{40}$/.test(v) ? (v as `0x${string}`) : null);

/** Contract addresses on BNB Chain. */
export const ADDR = {
  token: addr(env.VITE_TICK_TOKEN) || ("0xc2aF5a38362716Fcd01503498bDE858eb49790F8" as `0x${string}`),
  /** GANG's shared dividend vault: the holders' part of the $TICK tax waits here, in WBNB, until claimed. */
  dividendVault: "0x1BDBDD73f51079c64BCA3917629c84c257921aCc" as `0x${string}`,
};

export const LINKS = {
  gang: "https://gang.fun",
  buy: (env.VITE_BUY_URL as string | undefined) || `https://gang.fun/token/${ADDR.token}`,
  x: (env.VITE_X_URL as string | undefined) || "",
};

export const STOCK_NAMES: Record<string, string> = {
  NVDAB: "NVIDIA", SPCXB: "SpaceX", QQQB: "Nasdaq-100 ETF", SPYB: "S&P 500 ETF", BNCB: "CEA Industries",
  TSLAB: "Tesla", BABAB: "Alibaba", GOOGLB: "Alphabet", AAPLB: "Apple", CRCLB: "Circle", MSFTB: "Microsoft",
  GMEB: "GameStop", MSTRB: "Strategy", AMZNB: "Amazon", METAB: "Meta", NFLXB: "Netflix", INTCB: "Intel",
  TSMB: "TSMC", HOODB: "Robinhood", BMNRB: "BitMine",
};
