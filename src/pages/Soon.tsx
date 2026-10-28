import { useI18n, type Key } from "../i18n";

/** A coming-soon page for a feature on the roadmap: what it will do, in a few lines. */
export default function Soon({ id }: { id: "tasks" | "studio" | "mirror" }) {
  const { t } = useI18n();
  const points = [1, 2, 3].map((i) => `soon.${id}.${i}` as Key);
  return (
    <div className="wrap">
      <section className="section" style={{ marginTop: 36 }}>
        <span className="mk soon">{t("ag.soon")}</span>
        <h2 style={{ fontSize: 28, margin: "12px 0 6px" }}>{t(`soon.${id}` as Key)}</h2>
        <p className="muted lead">{t(`soon.${id}.d` as Key)}</p>
        <ol className="rules-list soon-points">
          {points.map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ol>
        <div className="row-gap" style={{ marginTop: 20 }}>
          <a className="btn" href="#/agents">
            {t("ag.back")}
          </a>
        </div>
      </section>
    </div>
  );
}
