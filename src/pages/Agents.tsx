import { useState } from "react";
import { useI18n } from "../i18n";
import { usePoll, type AgentDetail, type AgentList, type AgentSummary } from "../api";
import { EquityChart, PaperBadge, Panel, Stat } from "../components/common";
import { ago, clock, pct, signedUsd, tone, usd } from "../format";
import { CATEGORY_EN, NARRATIVE_EN } from "../labels";
import { PackageBrowser } from "../components/PackageBrowser";
const STAGE: Record<string, [string, string]> = {
  outer: ["外盘", "Graduated"],
  inner_late: ["内盘后半", "Late curve"],
  inner_early: ["内盘前半", "Early curve"],
  unknown: ["—", "—"],
};
const SKIP: Record<string, [string, string]> = {
  nodata: ["没有币的数据", "No token data"],
  honeypot: ["貔貅", "Honeypot"],
  mcap: ["市值不在范围", "Market cap out of range"],
  stage: ["阶段不对", "Wrong stage"],
  narrative: ["叙事不做", "Narrative not traded"],
  tax: ["税太高", "Tax too high"],
  top10: ["前十持仓太集中", "Top 10 too concentrated"],
  bundler: ["捆绑太多", "Too many bundlers"],
  rat: ["老鼠仓太多", "Too many rat traders"],
  insider: ["内鬼太多", "Too many insiders"],
  dev: ["狗庄持仓太多", "Dev holds too much"],
  holders: ["持币人太少", "Too few holders"],
  noleader: ["还没有车头", "No leader in yet"],
  age: ["币龄太老", "Too old"],
  young: ["上线时间不够", "Too new"],
  launchpad: ["平台不做", "Platform not traded"],
  serialdev: ["狗庄连环发币", "Serial-launcher dev"],
  growth: ["持币人没在涨", "Holders not growing"],
};

const mcapText = (v: number | null | undefined, zh: boolean) =>
  v === null || v === undefined || !Number.isFinite(v)
    ? "—"
    : zh
      ? v >= 1e4
        ? `${(v / 1e4).toFixed(v >= 1e5 ? 0 : 1)} 万`
        : `$${Math.round(v)}`
      : v >= 1e6
        ? `$${(v / 1e6).toFixed(2)}M`
        : `$${Math.round(v / 1e3)}k`;

function Spark({ values, base }: { values: number[]; base: number }) {
  const lo = Math.min(base, ...values);
  const hi = Math.max(base, ...values);
  const span = hi - lo || 1;
  const x = (i: number) => (i / (values.length - 1)) * 120;
  const y = (v: number) => 34 - ((v - lo) / span) * 32;
  const up = values[values.length - 1] >= base;
  return (
    <svg className={"spark " + (up ? "up" : "down")} viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" x2="120" y1={y(base)} y2={y(base)} className="base" />
      <polyline points={values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")} />
    </svg>
  );
}

function MarketChip({ m }: { m: AgentSummary["market"] }) {
  const { t } = useI18n();
  return <span className={"mk " + m}>{m === "trench" ? t("ag.trench") : m === "skill" ? t("ag.skill") : t("ag.stocks")}</span>;
}

function SkillCard({ a }: { a: AgentSummary }) {
  const { t, lang } = useI18n();
  const zh = lang === "zh";
  return (
    <a className="agent-card" href={`#/agents/${a.id}`}>
      <div className="agent-top">
        <MarketChip m="skill" />
        <span className="muted">{zh ? a.category : a.categoryEn || a.category}</span>
      </div>
      <h3>{a.name}</h3>
      <p className="muted">{a.tagline}</p>
      <div className="agent-foot muted">
        <span className="mono">{a.author}</span>
        <span className="go">{t("ag.viewSkill")}</span>
      </div>
    </a>
  );
}

function SkillPage({ d }: { d: AgentDetail }) {
  const { t, lang } = useI18n();
  const zh = lang === "zh";
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard
      .writeText(d.skillMd ?? "")
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  };
  return (
    <div className="wrap">
      <section className="section" style={{ marginTop: 28 }}>
        <a className="muted back" href="#/agents">
          {t("ag.back")}
        </a>
        <div style={{ marginTop: 14 }}>
          <MarketChip m="skill" /> <span className="muted small">{zh ? d.category : CATEGORY_EN[d.category ?? ""] ?? d.category}</span>
          <h2 style={{ fontSize: 28, margin: "10px 0 6px" }}>{d.name}</h2>
          <p className="muted lead">{d.tagline}</p>
          <p className="muted small">
            {t("sk.by")} <span className="mono">{d.author}</span> · {t("sk.listed")} {ago(d.startedAt, zh)}
          </p>
        </div>
      </section>
      <section className="section">
        <Panel title={t("sk.about")}>
          <p className="pre">{d.description}</p>
          {(d.repo || d.contact) && (
            <div className="row-gap" style={{ marginTop: 14 }}>
              {d.repo && (
                <a className="btn" href={d.repo} target="_blank" rel="noreferrer noopener">
                  {t("sk.repo")} ↗
                </a>
              )}
              {d.contact && (
                <span className="muted small">
                  {t("sk.contact")} {d.contact}
                </span>
              )}
            </div>
          )}
        </Panel>
      </section>
      {d.pkg && d.subId && (
        <section className="section">
          <Panel title={t("pkg.title")} sub={t("pkg.warn")}>
            <PackageBrowser subId={d.subId} pkg={d.pkg} />
          </Panel>
        </section>
      )}
      <section className="section">
        <Panel
          title="SKILL.md"
          right={
            <button className="btn" onClick={copy}>
              {copied ? t("ca.copied") : t("ca.copy")}
            </button>
          }
        >
          <pre className="code">{d.skillMd}</pre>
        </Panel>
        <p className="muted fine">{t("sk.reviewed")}</p>
      </section>
    </div>
  );
}

const nameOf = (a: AgentSummary, zh: boolean) => (zh ? a.name : a.nameEn || a.name);
const taglineOf = (a: AgentSummary, zh: boolean) => (zh ? a.tagline : a.taglineEn || a.tagline);
const authorOf = (a: AgentSummary, zh: boolean) => (zh ? a.author : a.author.replace(/\s*官方$/, ""));
const winText = (a: AgentSummary) => (a.winRate === null ? "—" : `${Math.round(a.winRate * 100)}%`);

function AgentCard({ a }: { a: AgentSummary }) {
  const { t, lang } = useI18n();
  const zh = lang === "zh";
  if (a.market === "skill") return <SkillCard a={a} />;
  return (
    <a className="agent-card" href={`#/agents/${a.id}`}>
      <div className="agent-top">
        <MarketChip m={a.market} />
        <span className="muted">{authorOf(a, zh)}</span>
      </div>
      <h3>{nameOf(a, zh)}</h3>
      <p className="muted">{taglineOf(a, zh)}</p>
      <div className="agent-mid">
        <div>
          <div className={"ret " + tone(a.pnlPct)}>{pct(a.pnlPct)}</div>
          <div className="muted small">{t("ag.return")}</div>
        </div>
        {a.spark && a.spark.length > 1 && <Spark values={a.spark} base={a.capitalUsd} />}
      </div>
      <div className="agent-metrics">
        <span>
          <b className={tone(a.pnlUsd)}>{signedUsd(a.pnlUsd, 0)}</b>
          <i>{t("ag.pnl")}</i>
        </span>
        <span>
          <b>{winText(a)}</b>
          <i>
            {t("ag.winrate")} · {a.trades} {t("ag.trades")}
          </i>
        </span>
        <span>
          <b>{a.open}</b>
          <i>{t("ag.open")}</i>
        </span>
      </div>
      <div className="agent-foot muted">
        <span>
          {t("ag.since")} {ago(a.startedAt, zh)}
        </span>
        <span className="go">{t("ag.view")}</span>
      </div>
    </a>
  );
}

function Store() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"all" | "trench" | "stocks" | "skill">("all");
  const list = usePoll<AgentList>("/api/agents", 15_000);
  const agents = (list.data?.agents ?? []).filter((a) => tab === "all" || a.market === tab);
  return (
    <div className="wrap">
      <section className="section" style={{ marginTop: 36 }}>
        <div className="panel-head">
          <div>
            <h2 style={{ fontSize: 26 }}>{t("ag.title")}</h2>
            <p className="muted lead">{t("ag.sub")}</p>
            <div className="notice">
              <PaperBadge />
            </div>
          </div>
          <div className="store-tools">
            <div className="ranges">
              {(["all", "trench", "stocks", "skill"] as const).map((k) => (
                <button key={k} className={k === tab ? "on" : ""} onClick={() => setTab(k)}>
                  {t(`ag.${k}` as "ag.all")}
                </button>
              ))}
            </div>
            <a className="btn primary small-btn" href="#/publish">
              {t("ag.publish")}
            </a>
          </div>
        </div>
        {list.data?.trench && !list.data.trench.live && <div className="notice">{t("ag.stale")}</div>}
        {!list.data && <div className="empty">{list.error ? t("offline") : t("loading")}</div>}
        <div className="agents-grid">
          {agents.map((a) => (
            <AgentCard key={a.id} a={a} />
          ))}
        </div>
      </section>
      <section className="section">
        <div className="agents-grid">
          {(["studio", "mirror"] as const).map((k) => (
            <a key={k} className="agent-card soon" href={`#/${k}`}>
              <div className="agent-top">
                <span className="mk soon">{t("ag.soon")}</span>
              </div>
              <h3>{t(`ag.soon.${k}` as "ag.soon.studio")}</h3>
              <p className="muted">{t(`ag.soon.${k}.d` as "ag.soon.studio.d")}</p>
            </a>
          ))}
        </div>
        <p className="muted fine">{t("ag.fills")}</p>
      </section>
    </div>
  );
}

function AgentPage({ id }: { id: string }) {
  const { t, lang } = useI18n();
  const zh = lang === "zh";
  const res = usePoll<AgentDetail>(`/api/agents/${id}`, 15_000);
  const d = res.data;
  if (!d)
    return (
      <div className="wrap">
        <div className="empty" style={{ marginTop: 40 }}>
          {res.error ? t("offline") : t("loading")}
        </div>
      </div>
    );
  if (d.market === "skill") return <SkillPage d={d} />;
  const rules = (zh ? d.rules : d.rulesEn) ?? d.rules;
  const points = (d.equity ?? []).map((e) => ({ t: e.t, eq: e.v, cash: 0, pos: 0 }));
  const narrative = (n: string) => (zh ? n : NARRATIVE_EN[n] ?? n);
  const stage = (s: string) => (STAGE[s] ?? STAGE.unknown)[zh ? 0 : 1];
  const skips = Object.entries(d.skips ?? {}).sort((a, b) => b[1] - a[1]);
  return (
    <div className="wrap">
      <section className="section" style={{ marginTop: 28 }}>
        <a className="muted back" href="#/agents">
          {t("ag.back")}
        </a>
        <div className="panel-head" style={{ marginTop: 14 }}>
          <div>
            <MarketChip m={d.market} />
            <h2 style={{ fontSize: 28, margin: "10px 0 6px" }}>{nameOf(d, zh)}</h2>
            <p className="muted lead">{taglineOf(d, zh)}</p>
            <div className="notice">
              <PaperBadge />
            </div>
          </div>
          {d.link && (
            <a className="btn" href={d.link}>
              {t("ag.desk")}
            </a>
          )}
        </div>
        <div className="stats">
          <Stat k={t("ag.equity")} v={usd(d.equityUsd)} />
          <Stat
            k={t("ag.pnl")}
            v={
              <>
                {signedUsd(d.pnlUsd)}
                <small>{pct(d.pnlPct)}</small>
              </>
            }
            cls={tone(d.pnlUsd)}
          />
          <Stat k={t("ag.winrate")} v={`${winText(d)} · ${d.trades}`} />
          <Stat k={t("ag.open")} v={String(d.open)} />
          <Stat k={t("ag.capital")} v={usd(d.capitalUsd, 0)} />
          {!!d.sizeUsd && <Stat k={t("ag.size")} v={usd(d.sizeUsd, 0)} />}
          <Stat k={t("ag.since")} v={ago(d.startedAt, zh)} />
        </div>
      </section>

      <section className={"section" + (points.length > 1 ? " grid-2" : "")}>
        <Panel title={t("ag.rules")}>
          <ol className="rules-list">
            {rules.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        </Panel>
        {points.length > 1 && (
          <Panel title={t("ag.equity")}>
            <EquityChart points={points} base={d.capitalUsd} />
          </Panel>
        )}
      </section>

      {d.positions && (
        <section className="section">
          <Panel title={t("ag.positions")}>
            {d.positions.length === 0 ? (
              <div className="empty">{t("ag.positions.empty")}</div>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{t("ag.token")}</th>
                      <th>{t("ag.narrative")}</th>
                      <th>{t("ag.stage")}</th>
                      <th className="num">{t("ag.mcap")}</th>
                      <th className="num">{t("col.pnl")}</th>
                      <th className="num">{t("ag.held")}</th>
                      <th>{t("ag.whyBuy")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.positions.map((p) => (
                      <tr key={p.token}>
                        <td className="sym">{p.symbol}</td>
                        <td>{narrative(p.narrative)}</td>
                        <td className="muted">{stage(p.stage)}</td>
                        <td className="num">{mcapText(p.mcap, zh)}</td>
                        <td className={"num " + tone(p.pnlUsd)}>{signedUsd(p.pnlUsd)}</td>
                        <td className="num muted">{ago(p.openedAt, zh)}</td>
                        <td className="why">{zh ? p.why : p.whyEn || p.why}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </section>
      )}

      {d.history && (
        <section className="section">
          <Panel title={t("ag.history")}>
            {d.history.length === 0 ? (
              <div className="empty">{t("ag.history.empty")}</div>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{t("col.time")}</th>
                      <th>{t("ag.token")}</th>
                      <th className="num">{t("col.pnl")}</th>
                      <th>{t("ag.whyBuy")}</th>
                      <th>{t("ag.whySell")}</th>
                      <th>{t("ag.narrative")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.history.map((x) => (
                      <tr key={`${x.token}-${x.closedAt}`}>
                        <td className="muted mono small">{clock(x.closedAt)}</td>
                        <td className="sym">{x.symbol}</td>
                        <td className={"num " + tone(x.pnl)}>
                          {signedUsd(x.pnl)} <small>{pct(x.pnlPct, 1)}</small>
                        </td>
                        <td className="why">{zh ? x.why : x.whyEn || x.why}</td>
                        <td className="why">{zh ? x.exitWhy : x.exitWhyEn || x.exitWhy}</td>
                        <td className="muted">{narrative(x.narrative)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </section>
      )}

      {skips.length > 0 && (
        <section className="section">
          <Panel title={t("ag.skips")}>
            <div className="chips">
              {skips.map(([k, n]) => (
                <span key={k}>
                  {(SKIP[k] ?? [k, k])[zh ? 0 : 1]} <b>{n}</b>
                </span>
              ))}
            </div>
          </Panel>
        </section>
      )}
      {d.market === "trench" && <p className="muted fine">{t("ag.fills")}</p>}
    </div>
  );
}

export default function Agents({ id }: { id?: string }) {
  return id ? <AgentPage id={id} /> : <Store />;
}
