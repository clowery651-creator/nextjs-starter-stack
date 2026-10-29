import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const markSrc = `data:image/png;base64,${await readFile(join(process.cwd(), "public/brand/mark.png"), "base64")}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: 80,
          background: "radial-gradient(ellipse at 75% 40%, rgba(124,58,237,0.45), #07060a 65%)",
          color: "#f4f2f8",
        }}
      >
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img src={markSrc} width={380} height={380} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 0.95, textTransform: "uppercase", display: "flex", flexDirection: "column" }}>
            <span>Twisted</span>
            <span style={{ color: "#a78bfa" }}>Reality E.N.T.</span>
          </div>
          <div style={{ fontSize: 34, color: "#a19bb3", letterSpacing: 4, textTransform: "uppercase" }}>{SITE_TAGLINE}</div>
        </div>
      </div>
    ),
    size,
  );
}
