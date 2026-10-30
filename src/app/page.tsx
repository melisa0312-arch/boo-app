import { ArrowDown, ArrowUpRight, Heart, Sparkles, LockKeyhole } from "lucide-react";
import { Header } from "@/components/header";
import { ArrowLink, Eyebrow, OrbitArt } from "@/components/ui";
import { getDictionary } from "@/lib/i18n/server";

export default async function WelcomePage() {
  const t = await getDictionary();
  return <><Header /><main id="main" className="page-width welcome-main">
    <section className="welcome-grid">
      <div className="welcome-copy"><Eyebrow><Sparkles size={22} className="tiny-star" aria-hidden="true" />{t.welcomeEyebrow}</Eyebrow>
        <h1>{t.welcomeTitle}<span className="welcome-accent">{t.welcomeAccent}<Sparkles aria-hidden="true" /></span></h1>
        <p className="intro-copy">{t.welcomeBody}</p>
        <div className="welcome-actions"><ArrowLink href="/signup">{t.welcomeCta}</ArrowLink><ArrowLink href="/login" secondary>{t.welcomeLogin}</ArrowLink></div>
        <p className="privacy-note"><LockKeyhole size={14} aria-hidden="true" />{t.private}</p>
      </div>
      <div className="welcome-visual"><div className="art-topline"><span>THE TWO OF US CLUB</span><Heart size={17} aria-hidden="true" /></div><OrbitArt /><div className="art-caption"><h2>{t.welcomeCardTitle}</h2><p>{t.welcomeCardBody}</p></div><span className="little-sticker" aria-hidden="true">EST.<br />TODAY<ArrowUpRight size={13} /></span></div>
    </section>
    <div className="welcome-bottom"><span><ArrowDown size={16} aria-hidden="true" />{t.welcomeNote}</span><span className="bottom-edition">bū. / CHAPTER 01</span></div>
    <section className="welcome-modules" aria-label={t.fourWorlds}>
      {[{ number: "01", title: t.nowTitle, body: t.nowBody, color: "iris" }, { number: "02", title: t.plansTitle, body: t.plansBody, color: "coral" }, { number: "03", title: t.worldTitle, body: t.worldBody, color: "lime" }, { number: "04", title: t.usTitle, body: t.usBody, color: "sky" }].map((item) => <article key={item.number} className={`welcome-module module-${item.color}`}><span>{item.number} /</span><h2>{item.title}</h2><p>{item.body}</p>{["02", "03"].includes(item.number) && <small>{t.later}</small>}</article>)}
    </section>
    <footer className="site-footer"><span>bū.</span><p>{t.footer}</p><Heart size={17} aria-hidden="true" /></footer>
  </main></>;
}
