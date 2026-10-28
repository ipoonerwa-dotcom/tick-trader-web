import { useI18n, type Key } from "../i18n";

/** The download. Rebuild the zip and update these together (size in bytes, sha256 of the zip). */
const PKG = {
  version: "1.0.0",
  href: "/downloads/tick-quicktrade-1.0.0.zip",
  size: 96047,
  sha256: "6bcb95601b93d28375190f4f7152d5d71799ae524efd5f02322e9b00f75dd329",
};

/** The quick trade browser extension: what it does, the download, how to install it. */
export default function QuickTrade() {
  const { t } = useI18n();
  const steps = [1, 2, 3, 4, 5].map((i) => `qt.s${i}` as Key);
  const faq = [1, 2, 3, 4, 5].map((i) => [`qt.q${i}`, `qt.a${i}`] as [Key, Key]);
  const toInstall = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("qt-install")?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <div className="wrap">
      <section className="qt-hero">
        <div>
          <span className="mk trench">{t("qt.kicker")}</span>
          <h2 className="qt-title">{t("qt.title")}</h2>
          <p className="muted lead">{t("qt.sub")}</p>
          <div className="row-gap" style={{ marginTop: 22 }}>
            <a className="btn primary" href={PKG.href} download>
              {t("qt.download")} v{PKG.version}
            </a>
            <a className="btn" href="#/quicktrade" onClick={toInstall}>
              {t("qt.how")}
            </a>
          </div>
          <p className="muted small mono qt-meta">
            zip · {Math.round(PKG.size / 1024)} KB · {t("qt.meta")}
            <br />
            {t("qt.sha")} {PKG.sha256.slice(0, 16)}…
          </p>
        </div>
        <img className="qt-shot" src="/quicktrade-panel.jpg" alt={t("qt.shot.alt")} width={1000} height={668} decoding="async" />
      </section>

      <section className="section feature-grid">
        {[1, 2, 3].map((i) => (
          <div className="panel" key={i}>
            <h3>{t(`qt.f${i}.h` as Key)}</h3>
            <p className="muted">{t(`qt.f${i}.d` as Key)}</p>
          </div>
        ))}
      </section>

      <section className="section" id="qt-install">
        <h3 className="sec-h">{t("qt.install")}</h3>
        <ol className="rules-list qt-steps">
          {steps.map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ol>
      </section>

      <section className="section">
        <h3 className="sec-h">{t("qt.faq")}</h3>
        <div className="qt-faq">
          {faq.map(([q, a]) => (
            <details key={q}>
              <summary>{t(q)}</summary>
              <p className="muted">{t(a)}</p>
            </details>
          ))}
        </div>
        <p className="muted small" style={{ marginTop: 18 }}>
          {t("qt.credit")}
        </p>
      </section>
    </div>
  );
}
