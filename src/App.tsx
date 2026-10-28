import { useEffect, useState } from "react";
import { LangProvider, useI18n, type Key } from "./i18n";
import Home from "./pages/Home";
import Desk from "./pages/Desk";
import Dividends from "./pages/Dividends";
import Signals from "./pages/Signals";
import Reports from "./pages/Reports";
import Agents from "./pages/Agents";
import Publish from "./pages/Publish";
import Mine from "./pages/Mine";
import Admin from "./pages/Admin";
import Soon from "./pages/Soon";
import QuickTrade from "./pages/QuickTrade";
import { LINKS } from "./config";

function useRoute() {
  const read = () => location.hash.replace(/^#\/?/, "").split("?")[0];
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

type Item = { href: string; label: Key; soon?: boolean; match: (r: string) => boolean };
type Group = { label: Key; items: Item[] };

const is = (name: string) => (r: string) => r === name || r.startsWith(name + "/");
/** The menu: what the site offers, grouped by what a visitor came to do. The review desk (#/admin) is not listed. */
const NAV: Group[] = [
  {
    label: "nav.g.store",
    items: [
      { href: "#/agents", label: "nav.agents", match: is("agents") },
      { href: "#/publish", label: "nav.publish", match: is("publish") },
      { href: "#/me", label: "nav.mine", match: is("me") },
    ],
  },
  { label: "nav.g.quick", items: [{ href: "#/quicktrade", label: "nav.g.quick", match: is("quicktrade") }] },
  { label: "nav.g.tasks", items: [{ href: "#/tasks", label: "nav.tasks", soon: true, match: is("tasks") }] },
  {
    label: "nav.g.create",
    items: [
      { href: "#/studio", label: "nav.studio", soon: true, match: is("studio") },
      { href: "#/mirror", label: "nav.mirror", soon: true, match: is("mirror") },
    ],
  },
  {
    label: "nav.g.desk",
    items: [
      { href: "#/desk", label: "nav.desk", match: is("desk") },
      { href: "#/signals", label: "nav.signals", match: is("signals") },
      { href: "#/reports", label: "nav.reports", match: is("reports") },
    ],
  },
  { label: "nav.g.tick", items: [{ href: "#/dividends", label: "nav.dividends", match: is("dividends") }] },
];

function Header({ route }: { route: string }) {
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [route]);
  const active = (g: Group) => g.items.some((i) => i.match(route));
  return (
    <header className="header">
      <div className="wrap">
        <a className="brand" href="#/">
          <img src="/logo.svg" alt="" />
          <b><span>TICK</span><br />TRADER</b>
        </a>
        <nav className="nav" aria-label={t("nav.menu")}>
          {NAV.map((g) =>
            g.items.length === 1 ? (
              <a key={g.label} className={active(g) ? "on" : ""} href={g.items[0].href}>
                {t(g.label)}
                {g.items[0].soon && <i className="soon-dot" aria-hidden="true" />}
              </a>
            ) : (
              <div key={g.label} className={"nav-group" + (active(g) ? " on" : "")}>
                <button type="button" className={active(g) ? "on" : ""} aria-haspopup="true">
                  {t(g.label)} <span className="caret" aria-hidden="true">▾</span>
                </button>
                <div className="nav-drop">
                  {g.items.map((i) => (
                    <a key={i.href} className={i.match(route) ? "on" : ""} href={i.href}>
                      {t(i.label)}
                      {i.soon && <span className="soon-tag">{t("ag.soon")}</span>}
                    </a>
                  ))}
                </div>
              </div>
            ),
          )}
        </nav>
        <div className="spacer" />
        {LINKS.x && (
          <a className="xlink" href={LINKS.x} target="_blank" rel="noreferrer" aria-label="X" title="X">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        )}
        <div className="lang">
          <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
          <button className={lang === "zh" ? "on" : ""} onClick={() => setLang("zh")}>中文</button>
        </div>
        <a className="btn primary" href={LINKS.buy} target="_blank" rel="noreferrer">{t("nav.buy")}</a>
        <button type="button" className="menu-btn" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((o) => !o)}>
          {open ? t("nav.close") : t("nav.menu")}
        </button>
      </div>
      {open && (
        <div className="mobile-menu" id="mobile-menu">
          <div className="wrap">
            {NAV.map((g) => (
              <div key={g.label} className="mm-group">
                <div className="mm-h">{t(g.label)}</div>
                {g.items.map((i) => (
                  <a key={i.href} className={i.match(route) ? "on" : ""} href={i.href}>
                    {t(i.label)}
                    {i.soon && <span className="soon-tag">{t("ag.soon")}</span>}
                  </a>
                ))}
              </div>
            ))}
            <a className="btn primary mm-buy" href={LINKS.buy} target="_blank" rel="noreferrer">{t("nav.buy")}</a>
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <div className="wrap">
        <span>{t("footer")}</span>
        <span style={{ display: "flex", gap: 16 }}>
          {LINKS.x && <a href={LINKS.x} target="_blank" rel="noreferrer">X</a>}
          <a href={LINKS.gang} target="_blank" rel="noreferrer">GANG</a>
        </span>
      </div>
    </footer>
  );
}

function Page({ route }: { route: string }) {
  const [head, sub] = route.split("/");
  switch (head) {
    case "desk":
      return <Desk />;
    case "dividends":
      return <Dividends />;
    case "signals":
      return <Signals />;
    case "reports":
      return <Reports id={sub || undefined} />;
    case "agents":
      return <Agents id={sub || undefined} />;
    case "publish":
      return <Publish />;
    case "me":
      return <Mine />;
    case "admin":
      return <Admin />;
    case "quicktrade":
      return <QuickTrade />;
    case "tasks":
    case "studio":
    case "mirror":
      return <Soon id={head} />;
    default:
      return <Home />;
  }
}

function Shell() {
  const route = useRoute();
  return (
    <>
      <Header route={route} />
      <main>
        <Page route={route} />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <LangProvider>
      <Shell />
    </LangProvider>
  );
}
