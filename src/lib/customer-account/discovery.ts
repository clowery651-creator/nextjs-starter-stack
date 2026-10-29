/**
 * OpenID + Customer Account API discovery, with env overrides and a
 * shop-id fallback. Results are memoized per server instance for an hour.
 *
 *   https://<shop>/.well-known/openid-configuration
 *   https://<shop>/.well-known/customer-account-api
 */
import type { CustomerAccountConfig } from "./config";

export type CustomerAccountEndpoints = {
  issuer?: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  endSessionEndpoint: string;
  jwksUri?: string;
  graphqlEndpoint: string;
};

/** Used only when neither discovery nor an override provides the GraphQL URL. */
export const FALLBACK_CUSTOMER_API_VERSION = "2026-10";
const TTL_MS = 60 * 60 * 1000;
let memo: { key: string; at: number; value: CustomerAccountEndpoints } | null = null;

type OpenIdConfig = {
  issuer?: string;
  authorization_endpoint?: string;
  token_endpoint?: string;
  end_session_endpoint?: string;
  jwks_uri?: string;
};
type CustomerApiConfig = { graphql_api?: string };

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[accounts] discovery failed for ${url}`, err);
    return null;
  }
}

function withVersion(url: string, version?: string): string {
  return version ? url.replace(/\/customer\/api\/[^/]+\/graphql/, `/customer/api/${version}/graphql`) : url;
}

export async function getEndpoints(config: CustomerAccountConfig): Promise<CustomerAccountEndpoints> {
  const key = JSON.stringify([config.shopDomain, config.shopId, config.apiVersion, config.overrides]);
  if (memo && memo.key === key && Date.now() - memo.at < TTL_MS) return memo.value;

  const o = config.overrides;
  const needOidc = !o.authorizationEndpoint || !o.tokenEndpoint || !o.endSessionEndpoint;
  const base = config.shopDomain ? `https://${config.shopDomain}` : null;
  const [oidc, api] = await Promise.all([
    base && needOidc ? getJson<OpenIdConfig>(`${base}/.well-known/openid-configuration`) : null,
    base && !o.graphqlEndpoint ? getJson<CustomerApiConfig>(`${base}/.well-known/customer-account-api`) : null,
  ]);

  const legacy = config.shopId ? `https://shopify.com/authentication/${config.shopId}` : null;
  const version = config.apiVersion ?? FALLBACK_CUSTOMER_API_VERSION;
  const value: CustomerAccountEndpoints = {
    issuer: oidc?.issuer ?? (legacy ?? undefined),
    authorizationEndpoint:
      o.authorizationEndpoint ?? oidc?.authorization_endpoint ?? (legacy ? `${legacy}/oauth/authorize` : ""),
    tokenEndpoint: o.tokenEndpoint ?? oidc?.token_endpoint ?? (legacy ? `${legacy}/oauth/token` : ""),
    endSessionEndpoint: o.endSessionEndpoint ?? oidc?.end_session_endpoint ?? (legacy ? `${legacy}/logout` : ""),
    jwksUri: oidc?.jwks_uri,
    graphqlEndpoint:
      o.graphqlEndpoint ??
      (api?.graphql_api
        ? withVersion(api.graphql_api, config.apiVersion)
        : config.shopId
          ? `https://shopify.com/${config.shopId}/account/customer/api/${version}/graphql`
          : ""),
  };

  if (!value.authorizationEndpoint || !value.tokenEndpoint || !value.graphqlEndpoint) {
    throw new Error(
      "Customer Account API discovery failed. Check SHOPIFY_STORE_DOMAIN, or set SHOPIFY_SHOP_ID / the SHOPIFY_CUSTOMER_ACCOUNT_*_URL overrides.",
    );
  }
  memo = { key, at: Date.now(), value };
  return value;
}
