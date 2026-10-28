import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { SignInGate } from "../components/SignInGate";
import { Panel } from "../components/common";
import { ago } from "../format";
import { CATEGORY_EN, STATUS } from "../labels";
import { storeCall, useSession, type Session, type Submission } from "../store";
import { PackageBrowser } from "../components/PackageBrowser";

/** One submission as its author or an admin sees it. */
export function SubmissionCard({ s, session, children }: { s: Submission; session?: Session | null; children?: React.ReactNode }) {
  const { t, lang } = useI18n();
  const zh = lang === "zh";
  const listing = s.type === "strategy" ? `#/agents/u-${s.id}` : `#/agents/s-${s.id}`;
  return (
    <div className="panel sub-card">
      <div className="agent-top">
        <span className={"mk " + (s.type === "strategy" ? "trench" : "skill")}>{s.type === "strategy" ? t("pub.kind.strategy") : t("pub.kind.skill")}</span>
        <span className={"pill st-" + s.status}>{(STATUS[s.status] ?? [s.status, s.status])[zh ? 0 : 1]}</span>
      </div>
      <h3>{s.data.name}</h3>
      <p className="muted">{s.data.tagline}</p>
      {s.type === "skill" && s.data.category && <p className="muted small">{zh ? s.data.category : CATEGORY_EN[s.data.category]}</p>}
      {s.rules && (
        <ol className="rules-list small-rules">
          {(zh ? s.rules[0] : s.rules[1]).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ol>
      )}
      {s.note && (
        <p className="note">
          {t("me.note")} {s.note}
        </p>
      )}
      {s.pkg && <PackageBrowser subId={s.id} pkg={s.pkg} session={session} />}
      <div className="agent-foot muted">
        <span>
          {t("me.sent")} {ago(s.createdAt, zh)}
        </span>
        {s.status === "approved" && (
          <a className="go" href={listing}>
            {t("me.view")}
          </a>
        )}
      </div>
      {children}
    </div>
  );
}

export default function Mine() {
  const { t } = useI18n();
  const auth = useSession();
  const [list, setList] = useState<Submission[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!auth.session) return;
    storeCall<Submission[]>("/api/store/mine", auth.session)
      .then(setList)
      .catch((e) => setErr((e as Error).message));
  }, [auth.session]);
  return (
    <div className="wrap">
      <section className="section" style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 26 }}>{t("me.title")}</h2>
        <p className="muted lead">{t("me.sub")}</p>
      </section>
      <section className="section">
        <SignInGate session={auth.session} busy={auth.busy} error={auth.error} onSignIn={auth.signIn} onSignOut={auth.signOut}>
          {err && <p className="down">{err}</p>}
          {!list && !err && <div className="empty">{t("loading")}</div>}
          {list && list.length === 0 && (
            <Panel>
              <div className="empty">
                {t("me.empty")}{" "}
                <a className="go" href="#/publish">
                  {t("nav.publish")} →
                </a>
              </div>
            </Panel>
          )}
          {list && list.length > 0 && (
            <div className="agents-grid">
              {list.map((s) => (
                <SubmissionCard key={s.id} s={s} session={auth.session} />
              ))}
            </div>
          )}
        </SignInGate>
      </section>
    </div>
  );
}
