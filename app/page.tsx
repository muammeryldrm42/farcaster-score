"use client";

import * as React from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { ScoreCard } from "@/components/ScoreCard";

export default function HomePage() {
  const [user, setUser] = React.useState<{
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
    bio?: string;
  } | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const inside = await sdk.isInMiniApp();
        if (!inside) return;
        const ctx: any = await (sdk as any).context;
        const u = ctx?.user;
        if (!u?.fid || !mounted) return;

        setUser({
          fid: u.fid,
          username: u.username,
          displayName: u.displayName,
          pfpUrl: u.pfpUrl,
          bio: u.bio,
        });
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "white" }}>
        <div style={{ width: "min(520px, 92vw)", border: "1px solid #eaeaea", borderRadius: 24, padding: 22, textAlign: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Farcaster Score</div>
          <div style={{ marginTop: 8, color: "#666", fontSize: 13, lineHeight: 1.4 }}>
            Open this website inside Farcaster (Warpcast) to auto-load your account.
          </div>
        </div>
      </div>
    );
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/u/${user.fid}` : undefined;

  return (
    <ScoreCard
      fid={user.fid}
      username={user.username}
      displayName={user.displayName}
      pfpUrl={user.pfpUrl}
      bio={user.bio}
      callReady
      shareUrl={shareUrl}
    />
  );
}
