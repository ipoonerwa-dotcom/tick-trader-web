import type { ReactNode } from "react";
import { useI18n } from "../i18n";
import { short } from "../format";
import type { Session } from "../store";

/** Asks for a wallet signature before showing `children`; shows who is signed in once done. */
export function SignInGate({
  session,
  busy,
  error,
  onSignIn,
  onSignOut,
  children,
}: {
  session: Session | null;
  busy: boolean;
  error: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const { t } = useI18n();
  if (!session) {
    return (
      <div className="panel gate">
        <p>{t("st.signin.why")}</p>
        <button className="btn primary" onClick={onSignIn} disabled={busy}>
          {busy ? t("st.signin.busy") : t("st.signin")}
        </button>
        <p className="muted small">{t("st.signin.note")}</p>
        {error && <p className="down small">{error === "nowallet" ? t("div.noWallet") : error}</p>}
      </div>
    );
  }
  return (
    <>
      <div className="whoami muted small">
        {t("st.signedin")} <span className="mono">{short(session.address)}</span>
        {session.admin && <span className="mk trench">{t("st.admin")}</span>}
        <button className="linkish" onClick={onSignOut}>
          {t("st.signout")}
        </button>
      </div>
      {children}
    </>
  );
}
