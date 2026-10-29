import { NextResponse, connection, type NextRequest } from "next/server";
import { getCustomerAccountConfig } from "@/lib/customer-account/config";
import { buildLogoutUrl } from "@/lib/customer-account/oauth";
import { SESSION_COOKIE, cookieOptions, unsealSession } from "@/lib/customer-account/session";
import { CUSTOMER_ACCOUNT_URL } from "@/lib/site";

async function logout(request: NextRequest) {
  await connection();
  const config = getCustomerAccountConfig();
  if (!config) return NextResponse.redirect(`${CUSTOMER_ACCOUNT_URL}/logout`, { status: 303 });

  const session = await unsealSession(request.cookies.get(SESSION_COOKIE)?.value, config.sessionSecret);
  let target = new URL("/", request.url).toString();
  if (session) {
    // End the Shopify session too, then come back to the site.
    target = await buildLogoutUrl(config, session.idToken).catch(() => target);
  }
  const res = NextResponse.redirect(target, { status: 303 });
  res.cookies.set(SESSION_COOKIE, "", cookieOptions(0));
  res.headers.set("Cache-Control", "no-store");
  return res;
}

/** POST /account/logout (header/menu form). SameSite=Lax blocks cross-site POSTs. */
export async function POST(request: NextRequest) {
  return logout(request);
}

/**
 * GET is accepted only for same-origin or direct navigations, so a
 * third-party page can't sign people out with an <img> or link.
 */
export async function GET(request: NextRequest) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return NextResponse.redirect(new URL("/account", request.url), { status: 302 });
  }
  return logout(request);
}
