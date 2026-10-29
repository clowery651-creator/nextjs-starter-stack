import "server-only";
import { cookies } from "next/headers";
import { getCustomerAccountConfig } from "./config";
import { SESSION_COOKIE, needsRefresh, unsealSession, type CustomerSession } from "./session";

/**
 * Data Access Layer for the signed-in customer. Reads the encrypted
 * session cookie (request-time, so callers must sit behind <Suspense>).
 * Token refresh happens in src/proxy.ts, which can write cookies; render
 * code only reads.
 */
export async function getSession(): Promise<CustomerSession | null> {
  const config = getCustomerAccountConfig();
  if (!config) return null;
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  return unsealSession(raw, config.sessionSecret);
}

/** A usable (unexpired) access token, or null. Server-only; never pass to the client. */
export async function getCustomerAccessToken(): Promise<string | null> {
  const session = await getSession();
  if (!session || needsRefresh(session)) return null;
  return session.accessToken;
}

export type AccountViewer =
  | { mode: "hosted" }
  | { mode: "signed-out" }
  | { mode: "signed-in"; firstName: string | null };

/** Narrow, client-safe view of the account state for the header/nav. */
export async function getAccountViewer(): Promise<AccountViewer> {
  if (!getCustomerAccountConfig()) return { mode: "hosted" };
  const session = await getSession();
  if (!session) return { mode: "signed-out" };
  return { mode: "signed-in", firstName: session.firstName ?? null };
}
