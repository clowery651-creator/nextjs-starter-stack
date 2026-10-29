import { NextResponse, type NextRequest } from "next/server";
import { getCustomerAccountConfig } from "@/lib/customer-account/config";
import { refreshSession } from "@/lib/customer-account/oauth";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  cookieOptions,
  needsRefresh,
  sealSession,
  unsealSession,
} from "@/lib/customer-account/session";

/**
 * Account routes only: refresh an expiring Customer Account access token
 * before rendering (Server Components can't write cookies), and mark every
 * account response noindex + no-store.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthRoute = /^\/account\/(login|authorize|logout)(\/|$)/.test(pathname);
  const config = getCustomerAccountConfig();
  const raw = request.cookies.get(SESSION_COOKIE)?.value;

  let res = NextResponse.next();
  if (config && raw && !isAuthRoute) {
    const session = await unsealSession(raw, config.sessionSecret);
    if (!session) {
      // Unreadable (rotated secret / tampered): drop it.
      request.cookies.delete(SESSION_COOKIE);
      res = NextResponse.next({ request: { headers: request.headers } });
      res.cookies.set(SESSION_COOKIE, "", cookieOptions(0));
    } else if (needsRefresh(session)) {
      const next = await refreshSession(config, session);
      if (next) {
        const sealed = await sealSession(next, config.sessionSecret);
        // Make the fresh token visible to this render, and persist it.
        request.cookies.set(SESSION_COOKIE, sealed);
        res = NextResponse.next({ request: { headers: request.headers } });
        res.cookies.set(SESSION_COOKIE, sealed, cookieOptions(SESSION_MAX_AGE));
      } else {
        request.cookies.delete(SESSION_COOKIE);
        res = NextResponse.next({ request: { headers: request.headers } });
        res.cookies.set(SESSION_COOKIE, "", cookieOptions(0));
      }
    }
  }
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export const config = {
  matcher: ["/account", "/account/:path*"],
};
