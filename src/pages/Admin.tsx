import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { SignInGate } from "../components/SignInGate";
import { Panel } from "../components/common";
import { short } from "../format";
import { storeCall, useSession, type Submission } from "../store";
import { SubmissionCard } from "./Mine";

type Queue = { pending: Submission[]; decided: Submission[] };

/** The review desk for the team: approve, reject with a reason, or take a listing down. Not linked in the menu. */
export default function Admin() {
  const { t } = useI18n();
  const auth = useSession();
  const [q, setQ] = useState<Queue | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!auth.session?.admin) return;
    storeCall<Queue>("/api/store/review", auth.session)
      .then(setQ)
      .catch((e) => setErr((e as Error).message));
  }, [auth.session]);
  useEffect(load, [load]);

  async function decide(id: string, decision: "approve" | "reject" | "unlist") {
    if (!auth.session) return;
    setBusy(id);
    setErr(null);
    try {
      await storeCall(`/api/store/review/${id}`, auth.session, { decision, note: notes[id] ?? "" });
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="wrap">
      <section className="section" style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 26 }}>{t("ad.title")}</h2>
        <p className="muted lead">{t("ad.sub")}</p>
      </section>
      <section className="section">
        <SignInGate session={auth.session} busy={auth.busy} error={auth.error} onSignIn={auth.signIn} onSignOut={auth.signOut}>
          {auth.session && !auth.session.admin ? (
            <Panel>
              <div className="empty">{t("ad.notAdmin")}</div>
            </Panel>
          ) : (
            <>
              {err && <p className="down">{err}</p>}
              {!q && !err && <div className="empty">{t("loading")}</div>}
              {q && (
                <>
                  <h3 className="sec-h">
                    {t("ad.pending")} · {q.pending.length}
                  </h3>
                  {q.pending.length === 0 && <div className="empty">{t("ad.none")}</div>}
                  <div className="review-list">
                    {q.pending.map((s) => (
                      <SubmissionCard key={s.id} s={s} session={auth.session}>
                        <p className="muted small">
                          {t("ad.author")} <span className="mono">{short(s.author)}</span>
                        </p>
                        {s.type === "skill" && (
                          <details className="skill-raw">
                            <summary>{t("ad.content")}</summary>
                            <p className="pre">{s.data.description}</p>
                            <pre className="code">{s.data.skillMd}</pre>
                            {s.data.repo && <p className="mono small">{s.data.repo}</p>}
                            {s.data.contact && <p className="small">{s.data.contact}</p>}
                          </details>
                        )}
                        <textarea
                          className="review-note"
                          rows={2}
                          placeholder={t("ad.note.ph")}
                          value={notes[s.id] ?? ""}
                          onChange={(e) => setNotes((n) => ({ ...n, [s.id]: e.target.value }))}
                        />
                        <div className="row-gap">
                          <button className="btn primary" disabled={busy === s.id} onClick={() => decide(s.id, "approve")}>
                            {t("ad.approve")}
                          </button>
                          <button className="btn" disabled={busy === s.id} onClick={() => decide(s.id, "reject")}>
                            {t("ad.reject")}
                          </button>
                        </div>
                      </SubmissionCard>
                    ))}
                  </div>
                  <h3 className="sec-h">{t("ad.decided")}</h3>
                  <div className="review-list">
                    {q.decided.map((s) => (
                      <SubmissionCard key={s.id} s={s} session={auth.session}>
                        {s.status === "approved" && (
                          <button className="btn" disabled={busy === s.id} onClick={() => decide(s.id, "unlist")}>
                            {t("ad.unlist")}
                          </button>
                        )}
                      </SubmissionCard>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </SignInGate>
      </section>
    </div>
  );
}
