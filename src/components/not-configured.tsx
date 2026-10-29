export function NotConfigured() {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
      <p className="font-medium">Shopify isn&apos;t connected yet.</p>
      <p className="mt-1 text-sm">
        Copy <code>.env.example</code> to <code>.env.local</code> and set{" "}
        <code>SHOPIFY_STORE_DOMAIN</code> and{" "}
        <code>SHOPIFY_STOREFRONT_ACCESS_TOKEN</code>.
      </p>
    </div>
  );
}

export function ErrorBox({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-100">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  );
}
