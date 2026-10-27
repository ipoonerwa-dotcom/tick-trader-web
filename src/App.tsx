import { useEffect, useState } from "react";
import { LangProvider, useI18n } from "./i18n";
import Home from "./pages/Home";
import Desk from "./pages/Desk";
import Dividends from "./pages/Dividends";
import { ADDR, LINKS } from "./config";

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
        </nav>
        <div className="spacer" />
        <div className="lang">
          <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
          <button className={lang === "zh" ? "on" : ""} onClick={() => setLang("zh")}>中文</button>
        </div>
        <a className="btn primary" href={LINKS.buy} target="_blank" rel="noreferrer">{ADDR.token ? t("nav.buy") : t("nav.soon")}</a>
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
      <main>{route === "desk" ? <Desk /> : route === "dividends" ? <Dividends /> : <Home />}</main>
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
