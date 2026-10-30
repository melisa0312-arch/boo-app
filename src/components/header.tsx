import Link from "next/link";
import { Compass, CalendarDays, Heart, UserRound, LogOut, LockKeyhole, ArrowUpRight } from "lucide-react";
import { changeLocale, signOut } from "@/actions/auth";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Brand } from "./ui";

export async function Header({ authenticated = false }: { authenticated?: boolean }) {
  const t = await getDictionary();
  const locale = await getLocale();
  const nav = <>
    <Link href="/home"><Compass size={18} aria-hidden="true" /><span>{t.nowTitle}</span></Link>
    <span className="nav-later" aria-label={`${t.plansTitle}: ${t.later}`}><CalendarDays size={18} aria-hidden="true" /><span>{t.plansTitle}<small>{t.later}</small></span></span>
    <span className="nav-later" aria-label={`${t.worldTitle}: ${t.later}`}><Heart size={18} aria-hidden="true" /><span>{t.worldTitle}<small>{t.later}</small></span></span>
    <Link href="/profile"><UserRound size={18} aria-hidden="true" /><span>{t.usTitle}</span></Link>
  </>;
  return <>
    <header className="site-header page-width">
      <Brand />
      {authenticated ? <nav className="desktop-nav" aria-label={t.fourWorlds}>{nav}</nav> : <span className="header-note"><LockKeyhole size={14} aria-hidden="true" />{t.private}</span>}
      <div className="header-actions">
        <form action={changeLocale} className="language-switch" aria-label={t.language}>
          <button name="locale" value="bg" lang="bg" aria-label="Български" aria-pressed={locale === "bg"}>БГ</button>
          <button name="locale" value="en" lang="en" aria-label="English" aria-pressed={locale === "en"}>EN</button>
        </form>
        {authenticated ? <form action={signOut}><button className="icon-button" aria-label={t.logout} title={t.logout}><LogOut size={19} /></button></form> : <Link href="/login" className="header-login">{t.login}<ArrowUpRight size={16} aria-hidden="true" /></Link>}
      </div>
    </header>
    {authenticated && <nav className="mobile-nav" aria-label={t.fourWorlds}>{nav}</nav>}
  </>;
}
