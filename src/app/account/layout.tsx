import type { Metadata } from "next";

// Every account page is private: never index, never cache (see also src/proxy.ts).
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return children;
}
