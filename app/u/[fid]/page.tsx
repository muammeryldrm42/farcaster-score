import type { Metadata } from "next";
import { ScoreCard } from "@/components/ScoreCard";

function embedMeta(appUrl: string, imageUrl: string) {
  const miniapp = {
    version: "1",
    imageUrl,
    button: {
      title: "Open",
      action: {
        type: "launch_miniapp",
        url: appUrl,
      },
    },
  };
  return {
    "fc:miniapp": JSON.stringify(miniapp),
  } as Record<string, string>;
}

export async function generateMetadata({ params }: { params: { fid: string } }): Promise<Metadata> {
  const fid = params.fid;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  const pageUrl = baseUrl ? `${baseUrl}/u/${fid}` : `/u/${fid}`;
  const img = baseUrl ? `${baseUrl}/api/og?fid=${fid}` : `/api/og?fid=${fid}`;

  return {
    title: `Farcaster Score — FID ${fid}`,
    description: "Mint your Farcaster Score (0–100) on Base.",
    openGraph: {
      title: `Farcaster Score — FID ${fid}`,
      description: "Mint your Farcaster Score (0–100) on Base.",
      images: [img],
    },
    other: embedMeta(pageUrl, img),
  };
}

async function getScore(fid: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const url = baseUrl ? `${baseUrl}/api/score?fid=${fid}` : `http://localhost:3000/api/score?fid=${fid}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function UserPage({ params }: { params: { fid: string } }) {
  const data = await getScore(params.fid);
  const profile = data?.profile ?? {};
  const fid = Number(params.fid);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const shareUrl = baseUrl ? `${baseUrl}/u/${params.fid}` : undefined;

  return (
    <ScoreCard
      fid={fid}
      username={profile.username ?? undefined}
      displayName={profile.displayName ?? undefined}
      pfpUrl={profile.pfpUrl ?? undefined}
      bio={profile.bio ?? undefined}
      shareUrl={shareUrl}
    />
  );
}
