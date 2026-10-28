// The Agent store's signed-in side: a wallet signs a plain message (no transaction, no gas) and the store hands back a
// token kept in this browser for a week.
import { useState } from "react";
import { createWalletClient, custom, getAddress } from "viem";
import { bsc } from "viem/chains";
import { API_BASE } from "./config";

export const storeMessage = (address: string, issuedAt: string) => `Tick Trader store sign-in\n\nAddress: ${address}\nIssued at: ${issuedAt}`;

export interface Session {
  token: string;
  address: string;
  admin: boolean;
  expiresAt: number;
}

export interface Submission {
  id: string;
  type: "strategy" | "skill";
  status: "pending" | "approved" | "rejected" | "unlisted";
  author: string;
  createdAt: number;
  reviewedAt: number | null;
  note: string | null;
  data: {
    name: string;
    tagline: string;
    category?: string;
    description?: string;
    skillMd?: string;
    repo?: string | null;
    contact?: string | null;
  };
  rules: [string[], string[]] | null;
  pkg?: { name: string; size: number; sha256: string; files: { name: string; size: number }[]; removed?: boolean } | null;
}

const KEY = "tt.store.session";

function load(): Session | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null") as Session | null;
    return s && s.expiresAt > Date.now() ? s : null;
  } catch {
    return null;
  }
}
function save(s: Session | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {}
}

async function signIn(): Promise<Session> {
  if (!window.ethereum) throw new Error("nowallet");
  const [raw] = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
  const address = getAddress(raw);
  const issued = new Date().toISOString();
  const wallet = createWalletClient({ chain: bsc, transport: custom(window.ethereum) });
  const sig = await wallet.signMessage({ account: address, message: storeMessage(address, issued) });
  const r = await fetch(`${API_BASE}/api/store/session?${new URLSearchParams({ address, issued, sig })}`, { cache: "no-store" });
  const body = await r.json();
  if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
  save(body);
  return body as Session;
}

export async function storeCall<T>(path: string, session: Session, body?: unknown): Promise<T> {
  const r = await fetch(API_BASE + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${session.token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await r.json().catch(() => ({}));
  if (r.status === 401) save(null);
  if (!r.ok) throw new Error((data as { error?: string }).error || `HTTP ${r.status}`);
  return data as T;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(load);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return {
    session,
    busy,
    error,
    signIn: async () => {
      setBusy(true);
      setError(null);
      try {
        setSession(await signIn());
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    signOut: () => {
      save(null);
      setSession(null);
    },
  };
}
