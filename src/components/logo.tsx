import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group flex items-center gap-2 ${className}`} aria-label={`${SITE_NAME} home`}>
      <Image src="/brand/mark.png" alt="" width={36} height={36} priority className="h-9 w-9" />
      <span className="font-display text-lg leading-none uppercase tracking-wide sm:text-xl">
        <span className="glitch" data-text="Twisted Reality">
          Twisted Reality
        </span>{" "}
        <span className="text-glitch-soft">E.N.T.</span>
      </span>
    </Link>
  );
}
