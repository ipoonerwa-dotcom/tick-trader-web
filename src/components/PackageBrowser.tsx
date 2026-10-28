import { useState } from "react";
import { useI18n } from "../i18n";
import { API_BASE } from "../config";
import type { Session } from "../store";

export interface Pkg {
  name: string;
  size: number;
  sha256: string;
  files: { name: string; size: number }[];
  removed?: boolean;
}

type FileView = { path: string; size: number; text?: string; binary?: boolean; tooLarge?: boolean };

const kb = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : n >= 1e3 ? `${Math.round(n / 1e3)} KB` : `${n} B`);

/**
 * A skill's code package: summary, file list, any text file opened in place, and the zip itself. Listed packages are
 * public; before that the author's or an admin's session opens them.
 */
export function PackageBrowser({ subId, pkg, session }: { subId: string; pkg: Pkg; session?: Session | null }) {
  const { t } = useI18n();
  const [view, setView] = useState<FileView | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const headers: Record<string, string> = session ? { Authorization: `Bearer ${session.token}` } : {};

  async function open(path: string) {
    setErr(null);
    try {
      const r = await fetch(`${API_BASE}/api/store/file/${subId}?path=${encodeURIComponent(path)}`, { headers, cache: "no-store" });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
      setView(body as FileView);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function download() {
    setErr(null);
    try {
      const r = await fetch(`${API_BASE}/api/store/pkg/${subId}`, { headers, cache: "no-store" });
      if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error || `HTTP ${r.status}`);
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = pkg.name.endsWith(".zip") ? pkg.name : `${pkg.name}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  if (pkg.removed) return <p className="muted small">{t("pkg.removed")}</p>;
  return (
    <div className="pkg">
      <div className="pkg-head">
        <div>
          <b className="mono">{pkg.name}</b>
          <span className="muted small">
            {" "}
            · {kb(pkg.size)} · {pkg.files.length} {t("pkg.files")}
          </span>
          <div className="muted small mono" title={pkg.sha256}>
            sha256 {pkg.sha256.slice(0, 16)}…
          </div>
        </div>
        <button className="btn" onClick={download}>
          {t("pkg.download")}
        </button>
      </div>
      <div className="pkg-files">
        {pkg.files.map((f) => (
          <button key={f.name} className={"pkg-file" + (view?.path === f.name ? " on" : "")} onClick={() => open(f.name)}>
            <span className="mono">{f.name}</span>
            <span className="muted">{kb(f.size)}</span>
          </button>
        ))}
      </div>
      {err && <p className="down small">{err}</p>}
      {view && (
        <div className="pkg-view">
          <div className="muted small mono">{view.path}</div>
          {view.text !== undefined ? (
            <pre className="code">{view.text}</pre>
          ) : (
            <p className="muted small">{view.binary ? t("pkg.binary") : t("pkg.tooLarge")}</p>
          )}
        </div>
      )}
    </div>
  );
}
