import { useI18n, type Key } from "../i18n";
import { ContractAddress } from "./Home";

/** What already works today, linked from the home page. */
const LIVE: { href: string; title: Key; desc: Key }[] = [
  { href: "#/agents", title: "nav.agents", desc: "tk.live.agents" },
  { href: "#/quicktrade", title: "nav.g.quick", desc: "tk.live.quick" },
  { href: "#/quant", title: "nav.g.desk", desc: "tk.live.quant" },
  { href: "#/dividends", title: "nav.dividends", desc: "tk.live.div" },
];

/** The home page: the task market (coming soon), how it will work, and the parts of Tick Trader that are live now. */
export default function TaskHome() {
  const { t } = useI18n();
  return (
    <div className="wrap">
      <section className="hero">
        <div>
          <span className="mk soon">{t("ag.soon")}</span>
          <h1 style={{ marginTop: 16 }}>
            <span>TASK</span>
            <br />
            MARKET
          </h1>
          <p className="tagline">{t("tk.tagline")}</p>
          <p className="sub">{t("soon.tasks.d")}</p>
          <div className="ctas">
            <a className="btn primary" href="#/agents">{t("tk.cta.store")}</a>
            <a className="btn" href="#/quicktrade">{t("nav.g.quick")}</a>
          </div>
          <ContractAddress />
        </div>
        <div className="panel glow">
          <div className="panel-head">
            <div>
              <h3>{t("tk.ex.title")}</h3>
              <p>{t("tk.ex.sub")}</p>
            </div>
          </div>
          <div className="tk-tasks">
            {[1, 2, 3].map((i) => (
              <div className="tk-task" key={i}>
                <div>
                  <b>{t(`tk.ex${i}` as Key)}</b>
                  <span className="muted small">{t(`tk.ex${i}.who` as Key)}</span>
                </div>
                <span className="tk-pay mono">{t(`tk.ex${i}.pay` as Key)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="tk-h">{t("tk.how")}</h2>
        <div className="feature-grid">
          {[1, 2, 3].map((i) => (
            <div className="panel" key={i}>
              <span className="tk-step mono">0{i}</span>
              <h3>{t(`tk.s${i}` as Key)}</h3>
              <p className="muted">{t(`soon.tasks.${i}` as Key)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="tk-h">{t("tk.live")}</h2>
        <div className="feature-grid">
          {LIVE.map((x) => (
            <a className="panel tk-link" href={x.href} key={x.href}>
              <h3>{t(x.title)} →</h3>
              <p className="muted">{t(x.desc)}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
