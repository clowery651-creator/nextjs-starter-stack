import Link from "next/link";
import { Suspense } from "react";
import { UserIcon } from "@/components/account/account-menu";
import { HeaderAccount, HeaderMobileAccount } from "@/components/account/header-account";
import { CartButton } from "@/components/cart/cart-button";
import { Logo } from "@/components/logo";
import { getNavItems } from "./nav";
import { MobileNav } from "./mobile-nav";
import { SearchBox } from "./search-box";

export async function Header() {
  const items = await getNavItems();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-glitch focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        <MobileNav
          items={items}
          account={
            <Suspense
              fallback={
                <Link href="/account" className="block py-3 font-display text-2xl uppercase">
                  Account
                </Link>
              }
            >
              <HeaderMobileAccount />
            </Suspense>
          }
        />
        <Logo />
        <nav aria-label="Main" className="ml-6 hidden lg:block">
          <ul className="flex items-center gap-6 text-sm font-medium uppercase tracking-wider">
            {items.map((item) => (
              <li key={item.href + item.title}>
                {item.external ? (
                  <a href={item.href} className="text-muted hover:text-fg" rel="noopener">
                    {item.title}
                  </a>
                ) : (
                  <Link href={item.href} className="text-muted hover:text-fg">
                    {item.title}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:block">
            <Suspense fallback={<div className="h-9 w-64 border border-line" />}>
              <SearchBox />
            </Suspense>
          </div>
          <Link
            href="/search"
            aria-label="Search"
            className="grid h-9 w-9 place-items-center border border-line hover:border-glitch md:hidden"
          >
            <SearchIcon />
          </Link>
          <div className="hidden sm:block">
            <Suspense
              fallback={
                <Link
                  href="/account"
                  aria-label="Account"
                  className="grid h-9 w-9 place-items-center border border-line hover:border-glitch"
                >
                  <UserIcon />
                </Link>
              }
            >
              <HeaderAccount />
            </Suspense>
          </div>
          <CartButton />
        </div>
      </div>
    </header>
  );
}

export function SearchIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
