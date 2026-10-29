import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">Next.js Starter Stack</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        App Router, TypeScript and Tailwind, with a typed Shopify Storefront API
        helper. Ready to deploy on Vercel.
      </p>
      <div className="flex gap-4">
        <Link
          href="/products"
          className="rounded-full bg-black px-5 py-2.5 font-medium text-white dark:bg-white dark:text-black"
        >
          View products
        </Link>
        <a
          href="https://shop.twistedrealityentertainment.com"
          className="rounded-full border border-zinc-300 px-5 py-2.5 font-medium dark:border-zinc-700"
        >
          Visit the shop
        </a>
      </div>
    </main>
  );
}
