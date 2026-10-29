/**
 * Encrypted cookie sessions (JWE, dir + A256GCM via jose). Tokens never
 * leave the server: cookies are httpOnly, and only a narrow profile
 * ({ firstName }) is ever handed to rendering code.
 *
 * Pure helpers (string in, string out) so both route handlers and
 * src/proxy.ts can use them without next/headers.
 */
import { EncryptJWT, jwtDecrypt } from "jose";

export const SESSION_COOKIE = "tr_customer_session";
export const OAUTH_COOKIE = "tr_customer_oauth";
/** Session cookie lifetime. Refresh tokens are long-lived; access tokens are refreshed as needed. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
export const OAUTH_MAX_AGE = 60 * 10; // 10 minutes to finish signing in

export type CustomerSession = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  /** Epoch ms when the access token expires. */
  expiresAt: number;
  firstName?: string;
};

export type OAuthTransaction = {
  state: string;
  nonce: string;
  codeVerifier: string;
  returnTo: string;
};

const keyCache = new Map<string, Uint8Array>();

async function keyFor(secret: string, purpose: string): Promise<Uint8Array> {
  const id = `${purpose}:${secret}`;
  const hit = keyCache.get(id);
  if (hit) return hit;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(id));
  const key = new Uint8Array(digest);
  keyCache.set(id, key);
  return key;
}

async function seal(payload: Record<string, unknown>, secret: string, purpose: string, maxAge: number) {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .encrypt(await keyFor(secret, purpose));
}

async function unseal<T>(value: string | undefined, secret: string, purpose: string): Promise<T | null> {
  if (!value) return null;
  try {
    const { payload } = await jwtDecrypt(value, await keyFor(secret, purpose));
    return payload as T;
  } catch {
    return null; // tampered, expired or wrong secret: treat as signed out
  }
}

export function sealSession(session: CustomerSession, secret: string) {
  return seal({ ...session }, secret, "session", SESSION_MAX_AGE);
}

export async function unsealSession(value: string | undefined, secret: string): Promise<CustomerSession | null> {
  const s = await unseal<CustomerSession>(value, secret, "session");
  return s && typeof s.accessToken === "string" ? s : null;
}

export function sealOAuth(tx: OAuthTransaction, secret: string) {
  return seal({ ...tx }, secret, "oauth", OAUTH_MAX_AGE);
}

export function unsealOAuth(value: string | undefined, secret: string) {
  return unseal<OAuthTransaction>(value, secret, "oauth");
}

export function cookieOptions(maxAge: number, path = "/") {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path,
    maxAge,
  };
}

/** Refresh when the access token has less than this left. */
export const REFRESH_SKEW_MS = 60 * 1000;

export function needsRefresh(session: CustomerSession): boolean {
  return Date.now() > session.expiresAt - REFRESH_SKEW_MS;
}
