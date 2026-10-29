"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type AccountMenuProps =
  | { mode: "hosted" }
  | { mode: "signed-out" }
  | { mode: "signed-in"; firstName: string | null };

const boxCls =
  "flex h-9 items-center gap-2 border border-line px-2.5 text-xs font-semibold uppercase tracking-wider hover:border-glitch";

export function UserIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

function loginHref(pathname: string) {
  const back = pathname.startsWith("/account") ? "/account" : pathname;
  return `/account/login?return_to=${encodeURIComponent(back)}`;
}

/** Desktop header account control. */
export function AccountMenu(props: AccountMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const ref = useRef<HTMLDivElement>(null);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (props.mode === "hosted") {
    return (
      <Link href="/account" className={boxCls} data-testid="header-account">
        <UserIcon />
        <span className="hidden lg:inline">Sign in</span>
      </Link>
    );
  }
  if (props.mode === "signed-out") {
    // Plain <a>: /account/login is a route handler that redirects to Shopify.
    return (
      <a href={loginHref(pathname)} className={boxCls} data-testid="header-account">
        <UserIcon />
        <span className="hidden lg:inline">Sign in</span>
      </a>
    );
  }

  const name = props.firstName || "Account";
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen((v) => !v)}
        className={`${boxCls} ${open ? "border-glitch" : ""}`}
        data-testid="header-account"
      >
        <UserIcon />
        <span className="hidden max-w-28 truncate normal-case lg:inline">{name}</span>
        <svg aria-hidden viewBox="0 0 24 24" className="hidden h-3 w-3 lg:block" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <div
          id="account-menu"
          className="absolute right-0 top-11 z-40 w-56 border border-line bg-surface p-2 shadow-[4px_4px_0_0_var(--color-glitch)]"
        >
          <p className="px-3 pb-2 pt-1 text-xs uppercase tracking-wider text-muted">
            Signed in as <span className="normal-case text-fg">{name}</span>
          </p>
          <ul className="flex flex-col text-sm font-medium uppercase tracking-wider">
            <li>
              <Link href="/account" className="block px-3 py-2 hover:bg-surface-2 hover:text-glitch-soft">
                Account
              </Link>
            </li>
            <li>
              <Link href="/account/orders" className="block px-3 py-2 hover:bg-surface-2 hover:text-glitch-soft">
                Orders
              </Link>
            </li>
            <li className="mt-1 border-t border-line pt-1">
              <form action="/account/logout" method="post">
                <button
                  type="submit"
                  className="block w-full px-3 py-2 text-left uppercase tracking-wider hover:bg-surface-2 hover:text-glitch-soft"
                >
                  Sign out
                </button>
              </form>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}

const mobileLink = "block py-3 font-display text-2xl uppercase hover:text-glitch-soft";

/** Account entries for the mobile drawer. */
export function MobileAccountLinks(props: AccountMenuProps) {
  const pathname = usePathname();
  if (props.mode === "hosted") {
    return (
      <Link href="/account" className={mobileLink} data-testid="mobile-account">
        Sign in
      </Link>
    );
  }
  if (props.mode === "signed-out") {
    return (
      <a href={loginHref(pathname)} className={mobileLink} data-testid="mobile-account">
        Sign in
      </a>
    );
  }
  return (
    <div data-testid="mobile-account">
      <p className="pb-1 text-xs uppercase tracking-[0.25em] text-glitch-soft">Hi, {props.firstName || "there"}</p>
      <Link href="/account" className={mobileLink}>
        Account
      </Link>
      <Link href="/account/orders" className={mobileLink}>
        Orders
      </Link>
      <form action="/account/logout" method="post">
        <button type="submit" className={`${mobileLink} w-full text-left`}>
          Sign out
        </button>
      </form>
    </div>
  );
}
