export function NotConfigured() {
  return (
    <div className="border border-glitch/50 bg-glitch/10 p-4 text-fg">
      <p className="font-medium">Shopify isn&apos;t connected yet.</p>
      <p className="mt-1 text-sm text-muted">
        Set <code>SHOPIFY_STORE_DOMAIN</code> and <code>SHOPIFY_STOREFRONT_ACCESS_TOKEN</code> (see{" "}
        <code>.env.example</code>), then redeploy.
      </p>
    </div>
  );
}

export function ErrorBox({ title, message }: { title: string; message?: string }) {
  return (
    <div role="alert" className="border border-danger/50 bg-danger/10 p-4">
      <p className="font-medium">{title}</p>
      {message ? <p className="mt-1 text-sm text-muted">{message}</p> : null}
    </div>
  );
}
