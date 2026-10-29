import { getAccountViewer, rethrowIfPrerenderAbort } from "@/lib/customer-account";
import { AccountMenu, MobileAccountLinks, type AccountMenuProps } from "./account-menu";

async function viewer(): Promise<AccountMenuProps> {
  try {
    return await getAccountViewer();
  } catch (err) {
    rethrowIfPrerenderAbort(err);
    console.error("[accounts] viewer failed", err);
    return { mode: "signed-out" };
  }
}

/** Reads the session cookie: render inside <Suspense>. */
export async function HeaderAccount() {
  return <AccountMenu {...await viewer()} />;
}

export async function HeaderMobileAccount() {
  return <MobileAccountLinks {...await viewer()} />;
}
