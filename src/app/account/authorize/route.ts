import { NextResponse, connection, type NextRequest } from "next/server";
import { fetchFirstName } from "@/lib/customer-account/api";
import { getCustomerAccountConfig } from "@/lib/customer-account/config";
import { exchangeCode, verifyIdToken } from "@/lib/customer-account/oauth";
import {
  OAUTH_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  cookieOptions,
  sealSession,
  unsealOAuth,
} from "@/lib/customer-account/session";
import { CART_COOKIE, linkCartToCustomer } from "@/lib/shopify/cart";

function fail(request: NextRequest, reason: string) {
  const res = NextResponse.redirect(new URL(`/account?error=${encodeURIComponent(reason)}`, request.url), {
    status: 302,
  });
  res.cookies.set(OAUTH_COOKIE, "", { ...cookieOptions(0, "/account") });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

/** GET /account/authorize?code=…&state=… (OAuth callback). */
export async function GET(request: NextRequest) {
  await connection();
  const config = getCustomerAccountConfig();
  if (!config) return NextResponse.redirect(new URL("/account", request.url), { status: 302 });

  const params = request.nextUrl.searchParams;
  if (params.get("error")) {
    console.warn("[accounts] authorize error", params.get("error"), params.get("error_description"));
    return fail(request, "denied");
  }

  const tx = await unsealOAuth(request.cookies.get(OAUTH_COOKIE)?.value, config.sessionSecret);
  const code = params.get("code");
  const state = params.get("state");
  // CSRF: the state must match the one we issued to this browser.
  if (!tx || !code || !state || state !== tx.state) return fail(request, "state");

  try {
    const session = await exchangeCode(config, code, tx.codeVerifier);
    if (session.idToken) await verifyIdToken(config, session.idToken, tx.nonce);
    session.firstName = await fetchFirstName(session.accessToken).catch(() => undefined);

    // Attach an existing cart to the customer (prefills checkout). Best effort.
    const cartId = request.cookies.get(CART_COOKIE)?.value;
    if (cartId) await linkCartToCustomer(cartId, session.accessToken).catch(() => undefined);

    const res = NextResponse.redirect(new URL(tx.returnTo, request.url), { status: 302 });
    res.cookies.set(SESSION_COOKIE, await sealSession(session, config.sessionSecret), cookieOptions(SESSION_MAX_AGE));
    res.cookies.set(OAUTH_COOKIE, "", cookieOptions(0, "/account"));
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("[accounts] callback failed", err);
    return fail(request, "token");
  }
}
