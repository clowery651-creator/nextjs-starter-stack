/**
 * OAuth 2.0 Authorization Code + PKCE against the Customer Account API.
 * https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api/getting-started
 */
import { createRemoteJWKSet, decodeJwt, jwtVerify, type JWTPayload } from "jose";
import { getSiteUrl } from "@/lib/site";
import type { CustomerAccountConfig } from "./config";
import { getEndpoints } from "./discovery";
import type { CustomerSession } from "./session";

export const SCOPES = "openid email customer-account-api:full";

function base64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomString(bytes = 32): string {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function codeChallengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

export function redirectUri(): string {
  return `${getSiteUrl()}/account/authorize`;
}

/** Only same-site relative paths, never protocol-relative or absolute URLs. */
export function safeReturnTo(value: string | null | undefined, fallback = "/account"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.startsWith("/account/login") || value.startsWith("/account/authorize") || value.startsWith("/account/logout")) {
    return fallback;
  }
  return value;
}

export async function buildAuthorizeUrl(
  config: CustomerAccountConfig,
  p: { state: string; nonce: string; codeChallenge: string; locale?: string },
): Promise<string> {
  const { authorizationEndpoint } = await getEndpoints(config);
  const url = new URL(authorizationEndpoint);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("state", p.state);
  url.searchParams.set("nonce", p.nonce);
  url.searchParams.set("code_challenge", p.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  if (p.locale) url.searchParams.set("locale", p.locale);
  return url.toString();
}

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  token_type?: string;
};

function tokenHeaders(config: CustomerAccountConfig): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    // Shopify checks Origin against the client's JavaScript origins for public clients.
    Origin: getSiteUrl(),
    "User-Agent": "nextjs-starter-stack",
  };
  if (config.clientSecret) {
    headers.Authorization = `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`;
  }
  return headers;
}

async function tokenRequest(config: CustomerAccountConfig, body: URLSearchParams): Promise<TokenResponse> {
  const { tokenEndpoint } = await getEndpoints(config);
  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: tokenHeaders(config),
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Token request failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return (await res.json()) as TokenResponse;
}

function toSession(t: TokenResponse, prev?: CustomerSession): CustomerSession {
  return {
    accessToken: t.access_token,
    refreshToken: t.refresh_token ?? prev?.refreshToken,
    idToken: t.id_token ?? prev?.idToken,
    expiresAt: Date.now() + Math.max(0, (t.expires_in ?? 3600) * 1000),
    firstName: prev?.firstName,
  };
}

export async function exchangeCode(
  config: CustomerAccountConfig,
  code: string,
  codeVerifier: string,
): Promise<CustomerSession> {
  const t = await tokenRequest(
    config,
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      redirect_uri: redirectUri(),
      code,
      code_verifier: codeVerifier,
    }),
  );
  return toSession(t);
}

export async function refreshSession(
  config: CustomerAccountConfig,
  session: CustomerSession,
): Promise<CustomerSession | null> {
  if (!session.refreshToken) return null;
  try {
    const t = await tokenRequest(
      config,
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: config.clientId,
        refresh_token: session.refreshToken,
      }),
    );
    return toSession(t, session);
  } catch (err) {
    console.error("[accounts] refresh failed", err);
    return null;
  }
}

/**
 * Verifies the id_token signature (JWKS), issuer, audience and nonce.
 * Falls back to a nonce-only check if JWKS isn't discoverable.
 */
export async function verifyIdToken(
  config: CustomerAccountConfig,
  idToken: string,
  nonce: string,
): Promise<JWTPayload> {
  const { jwksUri, issuer } = await getEndpoints(config);
  let payload: JWTPayload;
  if (jwksUri) {
    const jwks = createRemoteJWKSet(new URL(jwksUri));
    ({ payload } = await jwtVerify(idToken, jwks, {
      audience: config.clientId,
      ...(issuer ? { issuer } : {}),
      clockTolerance: 60,
    }));
  } else {
    payload = decodeJwt(idToken);
  }
  if (payload.nonce !== nonce) throw new Error("id_token nonce mismatch");
  return payload;
}

export async function buildLogoutUrl(config: CustomerAccountConfig, idToken?: string): Promise<string> {
  const { endSessionEndpoint } = await getEndpoints(config);
  const url = new URL(endSessionEndpoint);
  if (idToken) url.searchParams.set("id_token_hint", idToken);
  url.searchParams.set("post_logout_redirect_uri", getSiteUrl());
  return url.toString();
}
