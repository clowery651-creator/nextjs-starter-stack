"use client";

/** Last-resort boundary (root layout failed). Must render its own <html>. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#07060a",
          color: "#f4f2f8",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: 520, padding: 24 }}>
          <p style={{ color: "#a78bfa", letterSpacing: "0.3em", fontSize: 12, textTransform: "uppercase" }}>
            Twisted Reality E.N.T.
          </p>
          <h1 style={{ fontSize: 40, margin: "12px 0", textTransform: "uppercase" }}>Signal lost</h1>
          <p style={{ color: "#a19bb3" }}>The store hit an unexpected error. Please try again.</p>
          {error.digest ? <p style={{ color: "#a19bb3", fontSize: 12 }}>Ref: {error.digest}</p> : null}
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 16, background: "#7c3aed", color: "white", border: 0, padding: "12px 20px", fontSize: 16, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
