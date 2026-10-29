"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { NavItem } from "@/lib/shopify/types";

export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    // Close on navigation (state adjusted during render, no effect needed).
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const links = [
    ...items,
    { title: "Search", href: "/search", external: false },
    { title: "Account", href: "/account", external: false },
  ];

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(true)}
        className="grid h-9 w-9 place-items-center border border-line hover:border-glitch lg:hidden"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      </button>
      {open
        ? // Portal out of the header: its backdrop-filter would otherwise become
          // the containing block for this fixed overlay.
          createPortal(
            <div
              className="fixed inset-0 z-50 lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              id="mobile-nav"
            >
              <button
                type="button"
                aria-label="Close menu"
                className="absolute inset-0 bg-black/70"
                onClick={() => setOpen(false)}
              />
              <nav className="scanlines absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col border-r border-line bg-surface p-6">
                <div className="mb-8 flex items-center justify-between">
                  <span className="font-display text-xl uppercase">Menu</span>
                  <button
                    type="button"
                    autoFocus
                    onClick={() => setOpen(false)}
                    aria-label="Close menu"
                    className="grid h-9 w-9 place-items-center border border-line"
                  >
                    ✕
                  </button>
                </div>
                <ul className="flex flex-col gap-1">
                  {links.map((item) => (
                    <li key={item.href + item.title}>
                      {item.external ? (
                        <a
                          href={item.href}
                          rel="noopener"
                          className="block py-3 font-display text-2xl uppercase hover:text-glitch-soft"
                        >
                          {item.title}
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          aria-current={pathname === item.href ? "page" : undefined}
                          className="block py-3 font-display text-2xl uppercase hover:text-glitch-soft aria-[current=page]:text-glitch-soft"
                        >
                          {item.title}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
