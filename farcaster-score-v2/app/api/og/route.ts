import { ImageResponse } from "next/og";

export const runtime = "edge";

const APP_NAME = "Farcaster Score";

async function fetchScore(fid?: string) {
  if (!fid) return null;
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || "";
    const url = `${base}/api/score?fid=${encodeURIComponent(fid)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid") || undefined;
  const data = await fetchScore(fid);

  const score = data?.breakdown?.total ?? null;
  const username = data?.profile?.username ? `@${data.profile.username}` : fid ? `FID ${fid}` : "Open in Farcaster";
  const subtitle = score === null ? "Mint your score on Base" : "Mint your score on Base (0.0001 ETH)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "800px",
          display: "flex",
          background: "white",
          color: "#111",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        }}
      >
        <div
          style={{
            width: "100%",
            border: "2px solid #eaeaea",
            borderRadius: "32px",
            padding: "64px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div style={{ fontSize: 56, fontWeight: 800 }}>{APP_NAME}</div>
          <div style={{ fontSize: 36, fontWeight: 600, color: "#444" }}>{username}</div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "20px", marginTop: "10px" }}>
            <div style={{ fontSize: 120, fontWeight: 900, letterSpacing: "-4px" }}>
              {score === null ? "—" : score}
            </div>
            <div style={{ fontSize: 34, fontWeight: 700, color: "#666" }}>/ 100</div>
          </div>

          <div style={{ fontSize: 32, color: "#666" }}>{subtitle}</div>

          <div
            style={{
              marginTop: "10px",
              padding: "22px 28px",
              borderRadius: "18px",
              border: "2px solid #111",
              fontSize: "30px",
              fontWeight: 700,
              width: "fit-content",
            }}
          >
            Mint 0.0001 ETH
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 800,
      headers: {
        "Cache-Control": "public, immutable, no-transform, max-age=300",
      },
    }
  );
}
