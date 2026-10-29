import Link from "next/link";
import { Logo } from "@/components/logo";
import { SITE_NAME, SITE_TAGLINE, SOCIAL_LINKS } from "@/lib/site";
import { getNavItems, getPolicies } from "./nav";

export async function Footer() {
  const [items, policies] = await Promise.all([getNavItems(), getPolicies()]);
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="flex flex-col gap-3 md:col-span-2">
          <Logo />
          <p className="max-w-sm text-sm text-muted">{SITE_TAGLINE}</p>
        </div>
        <nav aria-label="Shop">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-glitch-soft">Shop</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {items.map((item) => (
              <li key={item.href + item.title}>
                {item.external ? (
                  <a href={item.href} rel="noopener" className="text-muted hover:text-fg">
                    {item.title}
                  </a>
                ) : (
                  <Link href={item.href} className="text-muted hover:text-fg">
                    {item.title}
                  </Link>
                )}
              </li>
            ))}
            <li>
              <Link href="/search" className="text-muted hover:text-fg">
                Search
              </Link>
            </li>
            <li>
              <Link href="/account" className="text-muted hover:text-fg">
                Account
              </Link>
            </li>
          </ul>
        </nav>
        <div className="flex flex-col gap-8">
          {policies.length ? (
            <nav aria-label="Policies">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-glitch-soft">Info</h2>
              <ul className="flex flex-col gap-2 text-sm">
                {policies.map((p) => (
                  <li key={p.handle}>
                    <Link href={`/policies/${p.handle}`} className="text-muted hover:text-fg">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
          <nav aria-label="Social">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-glitch-soft">Follow</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {SOCIAL_LINKS.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer me" className="text-muted hover:text-fg">
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto w-full max-w-7xl px-4 py-5 text-xs text-muted sm:px-6">
          © {SITE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
