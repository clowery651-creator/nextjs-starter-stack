import { NextResponse, connection, type NextRequest } from "next/server";
import { getCustomerAccountConfig } from "@/lib/customer-account/config";
import { buildAuthorizeUrl, codeChallengeFor, randomString, safeReturnTo } from "@/lib/customer-account/oauth";
import { OAUTH_COOKIE, OAUTH_MAX_AGE, cookieOptions, sealOAuth } from "@/lib/customer-account/session";
import { CUSTOMER_ACCOUNT_URL } from "@/lib/site";

/**
 * GET /account/login?return_to=/account/orders
 * Starts Authorization Code + PKCE. state, nonce and the PKCE verifier go
 * into a short-lived encrypted httpOnly cookie scoped to /account.
 */
export async function GET(request: NextRequest) {
  await connection(); // always per-request (never prerendered)
  const config = getCustomerAccountConfig();
  if (!config) {
    // In-app accounts not configured: hand off to Shopify-hosted accounts.
    return NextResponse.redirect(CUSTOMER_ACCOUNT_URL, { status: 302 });
  }

  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("return_to"));
  const state = randomString(24);
  const nonce = randomString(24);
  const codeVerifier = randomString(48);

  let authorizeUrl: string;
  try {
    authorizeUrl = await buildAuthorizeUrl(config, {
      state,
      nonce,
      codeChallenge: await codeChallengeFor(codeVerifier),
    });
  } catch (err) {
    console.error("[accounts] login failed", err);
    return NextResponse.redirect(new URL("/account?error=unavailable", request.url), { status: 302 });
  }

  const res = NextResponse.redirect(authorizeUrl, { status: 302 });
  res.cookies.set(
    OAUTH_COOKIE,
    await sealOAuth({ state, nonce, codeVerifier, returnTo }, config.sessionSecret),
    cookieOptions(OAUTH_MAX_AGE, "/account"),
  );
  res.headers.set("Cache-Control", "no-store");
  return res;
}
