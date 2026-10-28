import { useState, type ReactNode } from "react";
import { useI18n } from "../i18n";
import { SignInGate } from "../components/SignInGate";
import { Panel } from "../components/common";
import { CATEGORIES, CATEGORY_EN, NARRATIVES, NARRATIVE_EN } from "../labels";
import { storeCall, useSession, type Submission } from "../store";

type Kind = "strategy" | "skill";

const STRATEGY = {
  name: "",
  tagline: "",
  head: false,
  boardNew: true,
  graduating: false,
  minHeads: "1",
  headWindowMin: "10",
  ageMinMin: "",
  ageMaxMin: "5",
  mcapMin: "0",
  mcapMax: "30000",
  maxTop10: "40",
  maxBundler: "25",
  maxRat: "",
  maxInsider: "20",
  maxDevHold: "5",
  maxTax: "5",
  minHolders: "",
  minLeaders: "",
  maxDevLaunches: "",
  tp: "2",
  tpShare: "50",
  trail: "40",
  sl: "50",
  maxHoldMin: "180",
  quickCheckSec: "",
  quickCheckGain: "",
  followLeaderOut: false,
  leaderDrop: "",
  sizeUsd: "50",
  maxOpen: "10",
};
const SKILL = { name: "", tagline: "", category: "链上工具", description: "", skillMd: "", repo: "", contact: "" };

const opt = (s: string) => (s.trim() === "" ? null : Number(s));
const frac = (s: string) => (s.trim() === "" ? null : Number(s) / 100);

function Field({ label, hint, children, wide }: { label: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={"field" + (wide ? " wide" : "")}>
      <span className="field-k">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

function Num({ value, onChange, suffix, placeholder }: { value: string; onChange: (v: string) => void; suffix?: string; placeholder?: string }) {
  return (
    <span className="num-in">
      <input inputMode="decimal" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))} />
      {suffix && <i>{suffix}</i>}
    </span>
  );
}

export default function Publish() {
  const { t, lang } = useI18n();
  const zh = lang === "zh";
  const auth = useSession();
  const [kind, setKind] = useState<Kind>("strategy");
  const [s, setS] = useState(STRATEGY);
  const [k, setK] = useState(SKILL);
  const [include, setInclude] = useState<string[]>([]);
  const [exclude, setExclude] = useState<string[]>(["币股"]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<Submission | null>(null);
  const [zip, setZip] = useState<{ name: string; size: number; base64: string } | null>(null);

  function pickZip(file: File | undefined) {
    setErr(null);
    if (!file) return setZip(null);
    if (!/\.zip$/i.test(file.name)) return setErr(t("pub.err.zipType"));
    if (file.size > 5_000_000) return setErr(t("pub.err.zipSize"));
    const reader = new FileReader();
    reader.onload = () => setZip({ name: file.name, size: file.size, base64: String(reader.result).replace(/^data:[^,]*,/, "") });
    reader.onerror = () => setErr(t("pub.err.zipRead"));
    reader.readAsDataURL(file);
  }
  const upd = (key: keyof typeof STRATEGY) => (v: string | boolean) => setS((x) => ({ ...x, [key]: v }));
  const updK = (key: keyof typeof SKILL) => (v: string) => setK((x) => ({ ...x, [key]: v }));
  const toggle = (list: string[], set: (l: string[]) => void, n: string) => set(list.includes(n) ? list.filter((x) => x !== n) : [...list, n]);
  const nar = (n: string) => (zh ? n : NARRATIVE_EN[n] ?? n);

  function payload() {
    if (kind === "skill")
      return { type: "skill", ...k, repo: k.repo.trim() || null, contact: k.contact.trim() || null, zip: zip ? { name: zip.name, base64: zip.base64 } : undefined };
    const triggers = [...(s.head ? ["head"] : []), ...(s.boardNew ? ["new"] : []), ...(s.graduating ? ["graduating"] : [])];
    return {
      type: "strategy",
      name: s.name,
      tagline: s.tagline,
      sizeUsd: Number(s.sizeUsd),
      maxOpen: Number(s.maxOpen),
      entry: {
        triggers,
        minHeads: Number(s.minHeads || 1),
        headWindowMin: Number(s.headWindowMin || 10),
        ageMinMin: opt(s.ageMinMin),
        ageMaxMin: opt(s.ageMaxMin),
        mcapMin: Number(s.mcapMin || 0),
        mcapMax: Number(s.mcapMax || 1e8),
        maxTop10: frac(s.maxTop10),
        maxBundler: frac(s.maxBundler),
        maxRat: frac(s.maxRat),
        maxInsider: frac(s.maxInsider),
        maxDevHold: frac(s.maxDevHold),
        maxTax: frac(s.maxTax) ?? 0.1,
        minHolders: opt(s.minHolders),
        minLeaders: opt(s.minLeaders),
        maxDevLaunches: opt(s.maxDevLaunches),
        include,
        exclude,
      },
      exit: {
        tp: opt(s.tp),
        tpShare: frac(s.tpShare) ?? 0.5,
        trail: frac(s.trail) ?? 0.3,
        sl: frac(s.sl),
        maxHoldMin: Number(s.maxHoldMin),
        quickCheckSec: opt(s.quickCheckSec),
        quickCheckGain: frac(s.quickCheckGain),
        followLeaderOut: s.followLeaderOut,
        leaderDrop: opt(s.leaderDrop),
      },
    };
  }

  async function submit() {
    if (!auth.session) return;
    setErr(null);
    if (kind === "strategy" && !s.head && !s.boardNew && !s.graduating) return setErr(t("pub.err.trigger"));
    setBusy(true);
    try {
      setDone(await storeCall<Submission>("/api/store/submissions", auth.session, payload()));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <section className="section" style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 26 }}>{t("pub.title")}</h2>
        <p className="muted lead">{t("pub.sub")}</p>
      </section>
      <section className="section">
        <SignInGate session={auth.session} busy={auth.busy} error={auth.error} onSignIn={auth.signIn} onSignOut={auth.signOut}>
          {done ? (
            <Panel title={t("pub.done")}>
              <p className="muted">{t("pub.done.d")}</p>
              {done.rules && (
                <ol className="rules-list">
                  {(zh ? done.rules[0] : done.rules[1]).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ol>
              )}
              <div className="row-gap" style={{ marginTop: 16 }}>
                <a className="btn primary" href="#/me">
                  {t("pub.toMine")}
                </a>
                <button className="btn" onClick={() => setDone(null)}>
                  {t("pub.again")}
                </button>
              </div>
            </Panel>
          ) : (
            <div className="form">
              <div className="ranges kind">
                <button className={kind === "strategy" ? "on" : ""} onClick={() => setKind("strategy")}>
                  {t("pub.kind.strategy")}
                </button>
                <button className={kind === "skill" ? "on" : ""} onClick={() => setKind("skill")}>
                  {t("pub.kind.skill")}
                </button>
              </div>
              <p className="muted small">{kind === "strategy" ? t("pub.kind.strategy.d") : t("pub.kind.skill.d")}</p>

              {kind === "strategy" ? (
                <>
                  <Panel title={t("pub.basic")}>
                    <div className="fields">
                      <Field label={t("pub.name")} hint={t("pub.name.h")}>
                        <input value={s.name} maxLength={30} onChange={(e) => upd("name")(e.target.value)} />
                      </Field>
                      <Field label={t("pub.tagline")} wide>
                        <input value={s.tagline} maxLength={100} onChange={(e) => upd("tagline")(e.target.value)} />
                      </Field>
                    </div>
                  </Panel>
                  <Panel title={t("pub.find")}>
                    <div className="checks">
                      <label><input type="checkbox" checked={s.head} onChange={(e) => upd("head")(e.target.checked)} /> {t("pub.find.head")}</label>
                      <label><input type="checkbox" checked={s.boardNew} onChange={(e) => upd("boardNew")(e.target.checked)} /> {t("pub.find.new")}</label>
                      <label><input type="checkbox" checked={s.graduating} onChange={(e) => upd("graduating")(e.target.checked)} /> {t("pub.find.grad")}</label>
                    </div>
                    <div className="fields">
                      {s.head && (
                        <>
                          <Field label={t("pub.minHeads")}><Num value={s.minHeads} onChange={upd("minHeads")} suffix={t("pub.u.heads")} /></Field>
                          <Field label={t("pub.headWindow")}><Num value={s.headWindowMin} onChange={upd("headWindowMin")} suffix={t("pub.u.min")} /></Field>
                        </>
                      )}
                      <Field label={t("pub.ageMin")} hint={t("pub.optional")}><Num value={s.ageMinMin} onChange={upd("ageMinMin")} suffix={t("pub.u.min")} /></Field>
                      <Field label={t("pub.ageMax")} hint={t("pub.optional")}><Num value={s.ageMaxMin} onChange={upd("ageMaxMin")} suffix={t("pub.u.min")} /></Field>
                      <Field label={t("pub.mcapMin")}><Num value={s.mcapMin} onChange={upd("mcapMin")} suffix="$" /></Field>
                      <Field label={t("pub.mcapMax")}><Num value={s.mcapMax} onChange={upd("mcapMax")} suffix="$" /></Field>
                    </div>
                  </Panel>
                  <Panel title={t("pub.chips")} sub={t("pub.chips.d")}>
                    <div className="fields">
                      <Field label={t("pub.top10")}><Num value={s.maxTop10} onChange={upd("maxTop10")} suffix="%" /></Field>
                      <Field label={t("pub.bundler")}><Num value={s.maxBundler} onChange={upd("maxBundler")} suffix="%" /></Field>
                      <Field label={t("pub.rat")}><Num value={s.maxRat} onChange={upd("maxRat")} suffix="%" /></Field>
                      <Field label={t("pub.insider")}><Num value={s.maxInsider} onChange={upd("maxInsider")} suffix="%" /></Field>
                      <Field label={t("pub.dev")}><Num value={s.maxDevHold} onChange={upd("maxDevHold")} suffix="%" /></Field>
                      <Field label={t("pub.tax")}><Num value={s.maxTax} onChange={upd("maxTax")} suffix="%" /></Field>
                      <Field label={t("pub.holders")}><Num value={s.minHolders} onChange={upd("minHolders")} /></Field>
                      <Field label={t("pub.leaders")}><Num value={s.minLeaders} onChange={upd("minLeaders")} suffix={t("pub.u.heads")} /></Field>
                      <Field label={t("pub.devLaunches")}><Num value={s.maxDevLaunches} onChange={upd("maxDevLaunches")} /></Field>
                    </div>
                    <div className="nar">
                      <span className="field-k">{t("pub.include")}</span>
                      <div className="chips pick">
                        {NARRATIVES.map((n) => (
                          <button key={n} className={include.includes(n) ? "on" : ""} onClick={() => toggle(include, setInclude, n)}>{nar(n)}</button>
                        ))}
                      </div>
                      <span className="field-k">{t("pub.exclude")}</span>
                      <div className="chips pick">
                        {NARRATIVES.map((n) => (
                          <button key={n} className={exclude.includes(n) ? "on off" : ""} onClick={() => toggle(exclude, setExclude, n)}>{nar(n)}</button>
                        ))}
                      </div>
                    </div>
                  </Panel>
                  <Panel title={t("pub.exit")}>
                    <div className="fields">
                      <Field label={t("pub.tp")} hint={t("pub.optional")}><Num value={s.tp} onChange={upd("tp")} suffix="x" /></Field>
                      <Field label={t("pub.tpShare")}><Num value={s.tpShare} onChange={upd("tpShare")} suffix="%" /></Field>
                      <Field label={t("pub.trail")}><Num value={s.trail} onChange={upd("trail")} suffix="%" /></Field>
                      <Field label={t("pub.sl")} hint={t("pub.optional")}><Num value={s.sl} onChange={upd("sl")} suffix="%" /></Field>
                      <Field label={t("pub.maxHold")}><Num value={s.maxHoldMin} onChange={upd("maxHoldMin")} suffix={t("pub.u.min")} /></Field>
                      <Field label={t("pub.quickSec")} hint={t("pub.quick.h")}><Num value={s.quickCheckSec} onChange={upd("quickCheckSec")} suffix={t("pub.u.sec")} /></Field>
                      <Field label={t("pub.quickGain")}><Num value={s.quickCheckGain} onChange={upd("quickCheckGain")} suffix="%" /></Field>
                      <Field label={t("pub.leaderDrop")} hint={t("pub.optional")}><Num value={s.leaderDrop} onChange={upd("leaderDrop")} suffix={t("pub.u.heads")} /></Field>
                    </div>
                    <div className="checks">
                      <label><input type="checkbox" checked={s.followLeaderOut} onChange={(e) => upd("followLeaderOut")(e.target.checked)} /> {t("pub.followOut")}</label>
                    </div>
                  </Panel>
                  <Panel title={t("pub.size")} sub={t("pub.size.d")}>
                    <div className="fields">
                      <Field label={t("pub.sizeUsd")} hint="20–200"><Num value={s.sizeUsd} onChange={upd("sizeUsd")} suffix="$" /></Field>
                      <Field label={t("pub.maxOpen")} hint="1–20"><Num value={s.maxOpen} onChange={upd("maxOpen")} /></Field>
                    </div>
                  </Panel>
                </>
              ) : (
                <Panel title={t("pub.kind.skill")}>
                  <div className="fields">
                    <Field label={t("pub.name")}>
                      <input value={k.name} maxLength={30} onChange={(e) => updK("name")(e.target.value)} />
                    </Field>
                    <Field label={t("pub.category")}>
                      <select value={k.category} onChange={(e) => updK("category")(e.target.value)}>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{zh ? c : CATEGORY_EN[c]}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label={t("pub.tagline")} wide>
                      <input value={k.tagline} maxLength={100} onChange={(e) => updK("tagline")(e.target.value)} />
                    </Field>
                    <Field label={t("pub.description")} hint={t("pub.description.h")} wide>
                      <textarea rows={6} value={k.description} maxLength={8000} onChange={(e) => updK("description")(e.target.value)} />
                    </Field>
                    <Field label={t("pub.zip")} hint={t("pub.zip.h")} wide>
                      <span className="file-pick">
                        <input type="file" accept=".zip,application/zip" onChange={(e) => pickZip(e.target.files?.[0])} />
                        {zip && (
                          <span className="muted small">
                            {zip.name} · {Math.max(1, Math.round(zip.size / 1000))} KB{" "}
                            <button type="button" className="linkish" onClick={() => setZip(null)}>
                              {t("pub.zip.remove")}
                            </button>
                          </span>
                        )}
                      </span>
                    </Field>
                    <Field label="SKILL.md" hint={zip ? t("pub.skillMd.hz") : t("pub.skillMd.h")} wide>
                      <textarea className="mono" rows={12} value={k.skillMd} maxLength={60000} onChange={(e) => updK("skillMd")(e.target.value)} />
                    </Field>
                    <Field label={t("pub.repo")} hint={t("pub.optional")}>
                      <input value={k.repo} placeholder="https://github.com/…" onChange={(e) => updK("repo")(e.target.value)} />
                    </Field>
                    <Field label={t("pub.contact")} hint={t("pub.optional")}>
                      <input value={k.contact} maxLength={100} placeholder="@telegram / @x" onChange={(e) => updK("contact")(e.target.value)} />
                    </Field>
                  </div>
                </Panel>
              )}
              {err && <p className="down">{t("pub.err")} {err}</p>}
              <div className="row-gap">
                <button className="btn primary" onClick={submit} disabled={busy}>
                  {busy ? t("pub.sending") : t("pub.submit")}
                </button>
                <span className="muted small">{t("pub.review.note")}</span>
              </div>
            </div>
          )}
        </SignInGate>
      </section>
    </div>
  );
}
