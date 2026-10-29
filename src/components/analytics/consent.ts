"use client";

/**
 * Minimal, first-party analytics consent. Shopify analytics events are only
 * sent after the visitor taps "Accept". Global Privacy Control always wins.
 * (Vercel Web Analytics / Speed Insights are cookieless and don't need this.)
 */
export type Consent = "granted" | "denied" | "unset";

const KEY = "tr-analytics-consent";
const EVENT = "tr-consent-change";

export function hasGlobalPrivacyControl(): boolean {
  if (typeof navigator === "undefined") return false;
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

export function getConsent(): Consent {
  if (typeof window === "undefined") return "unset";
  if (hasGlobalPrivacyControl()) return "denied";
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : "unset";
  } catch {
    return "unset";
  }
}

export function setConsent(value: Exclude<Consent, "unset">) {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    // storage blocked: treat as session-only choice
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeConsent(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
