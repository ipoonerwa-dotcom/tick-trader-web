import { useEffect, useState } from "react";
import { LangProvider, useI18n } from "./i18n";
import Home from "./pages/Home";
import Desk from "./pages/Desk";
import Dividends from "./pages/Dividends";
import Signals from "./pages/Signals";
import Reports from "./pages/Reports";
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

function Header({ route }: { route: string }) {
  const { t, lang, setLang } = useI18n();
  return (
    <header className="header">
      <div className="wrap">
        <a className="brand" href="#/">
          <img src="/logo.svg" alt="" />
          <b><span>TICK</span><br />TRADER</b>
        </a>
        <nav className="nav">
          <a className={route === "desk" ? "on" : ""} href="#/desk">{t("nav.desk")}</a>
          <a className={route === "dividends" ? "on" : ""} href="#/dividends">{t("nav.dividends")}</a>
          <a className={route === "signals" ? "on" : ""} href="#/signals">{t("nav.signals")}</a>
          <a className={route.startsWith("reports") ? "on" : ""} href="#/reports">{t("nav.reports")}</a>
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
      </div>
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

function Shell() {
  const route = useRoute();
  return (
    <>
      <Header route={route} />
      <main>
        {route === "desk" ? (
          <Desk />
        ) : route === "dividends" ? (
          <Dividends />
        ) : route === "signals" ? (
          <Signals />
        ) : route.startsWith("reports") ? (
          <Reports id={route.split("/")[1] || undefined} />
        ) : (
          <Home />
        )}
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
