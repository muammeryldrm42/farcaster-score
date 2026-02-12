"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { sdk } from "@farcaster/miniapp-sdk";
import {
  useAccount,
  useChainId,
  useConnect,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { CONTRACT_ABI, CONTRACT_ADDRESS, MINT_PRICE_WEI } from "@/lib/contract";

type Props = {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  bio?: string;
  // When true, we try to call sdk.actions.ready()
  callReady?: boolean;
  // For sharing the page
  shareUrl?: string;
};

function formatAddr(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ScoreCard(props: Props) {
  const { fid, username, displayName, pfpUrl, bio, callReady, shareUrl } = props;
  const [inMiniApp, setInMiniApp] = React.useState<boolean | null>(null);
  const [mintError, setMintError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const inside = await sdk.isInMiniApp();
        if (!mounted) return;
        setInMiniApp(inside);
        if (inside && callReady) {
          // Hide splash screen
          await sdk.actions.ready();
        }
      } catch {
        if (!mounted) return;
        setInMiniApp(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [callReady]);

  const q = useQuery({
    queryKey: ["score", fid],
    queryFn: async () => {
      const res = await fetch(`/api/score?fid=${fid}`);
      if (!res.ok) throw new Error("Score fetch failed");
      return res.json();
    },
    staleTime: 60_000,
  });

  const score = q.data?.breakdown?.total ?? null;
  const breakdown = q.data?.breakdown ?? null;

  // Wallet
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, isPending: isConnecting } = useConnect();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContract, data: txHash, isPending: isWriting, error: writeError } = useWriteContract();
  const { isLoading: isWaiting, isSuccess: isMined } = useWaitForTransactionReceipt({ hash: txHash });

  const { data: mintPriceOnChain, isError: mintPriceReadError } = useReadContract({
    address: (CONTRACT_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "mintPrice",
    query: {
      enabled: Boolean(CONTRACT_ADDRESS),
    },
  });

  const effectiveMintPrice = mintPriceOnChain ?? MINT_PRICE_WEI;

  const mintDisabled =
    !CONTRACT_ADDRESS ||
    score === null ||
    isWriting ||
    isWaiting ||
    isConnecting ||
    isSwitchingChain ||
    mintPriceReadError;

  async function onShare() {
    if (!shareUrl) return;
    try {
      const text = score === null
        ? `Check your Farcaster Score`
        : `My Farcaster Score is ${score}/100`;
      await sdk.actions.composeCast({
        text,
        embeds: [shareUrl],
      });
    } catch {
      // ignore
    }
  }

  async function onMint() {
    setMintError(null);
    if (!CONTRACT_ADDRESS) return;
    if (!isConnected) {
      connect({ connector: farcasterMiniApp() });
      return;
    }

    try {
      if (!address) return;

      if (chainId !== base.id) {
        await switchChainAsync({ chainId: base.id });
      }

      const sc: number = score ?? 0;
      if (!publicClient) return;

      await publicClient.simulateContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "mint",
        args: [BigInt(fid), sc],
        value: effectiveMintPrice,
        account: address,
      });

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "mint",
        args: [BigInt(fid), sc],
        value: effectiveMintPrice,
      });
    } catch (e) {
      setMintError(String((e as any)?.shortMessage || (e as any)?.message || e));
    }
  }

  const nameLine = displayName || (username ? `@${username}` : `FID ${fid}`);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {pfpUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pfpUrl} alt="pfp" width={44} height={44} style={styles.pfp} />
            ) : (
              <div style={{ ...styles.pfp, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                FC
              </div>
            )}
            <div>
              <div style={styles.title}>{nameLine}</div>
              <div style={styles.subtitle}>Farcaster Score</div>
            </div>
          </div>

          {shareUrl && inMiniApp ? (
            <button onClick={onShare} style={styles.shareBtn} aria-label="Share">
              Share
            </button>
          ) : null}
        </div>

        <div style={styles.scoreRow}>
          <div style={styles.score}>{score === null ? "—" : score}</div>
          <div style={styles.outOf}>/ 100</div>
        </div>

        {bio ? <div style={styles.bio}>{bio}</div> : null}

        <div style={styles.metaRow}>
          <span style={styles.badge}>FID {fid}</span>
          {address ? <span style={styles.badge}>{formatAddr(address)}</span> : null}
        </div>

        <div style={styles.breakdown}>
          <div style={styles.breakTitle}>Breakdown (sample-based)</div>
          {q.isLoading ? (
            <div style={styles.muted}>Loading…</div>
          ) : breakdown ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Bar label="Profile" value={breakdown.profile} max={20} />
              <Bar label="Activity" value={breakdown.activity} max={50} />
              <Bar label="Social" value={breakdown.social} max={30} />
              {Array.isArray(breakdown.notes) && breakdown.notes.length ? (
                <div style={styles.notes}>
                  {breakdown.notes.slice(0, 2).map((n: string) => (
                    <div key={n}>• {n}</div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div style={styles.muted}>Score unavailable (Hub/API issue)</div>
          )}
        </div>
      </div>

      <button onClick={onMint} style={styles.mintBtn} disabled={mintDisabled}>
        {CONTRACT_ADDRESS
          ? !isConnected
            ? (isConnecting ? "Connecting…" : "Mint 0.0001 ETH")
            : isSwitchingChain
              ? "Switching to Base…"
            : isWriting
              ? "Confirming…"
              : isWaiting
                ? "Minting…"
                : isMined
                  ? "Minted ✅"
                  : "Mint 0.0001 ETH"
          : "Set CONTRACT address"}
      </button>

      {writeError ? (
        <div style={styles.error}>
          {String((writeError as any)?.shortMessage || (writeError as any)?.message || writeError)}
        </div>
      ) : null}

      {mintError ? <div style={styles.error}>{mintError}</div> : null}

      {mintPriceReadError ? (
        <div style={styles.error}>
          Contract read failed. Check NEXT_PUBLIC_CONTRACT_ADDRESS (wrong network/address/ABI).
        </div>
      ) : null}

      {inMiniApp === false ? (
        <div style={styles.mutedSmall}>
          Open this link inside Farcaster to auto-connect and mint.
        </div>
      ) : null}
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#444" }}>
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div style={{ height: 10, background: "#f3f3f3", borderRadius: 999 }}>
        <div style={{ width: `${pct}%`, height: 10, background: "#111", borderRadius: 999 }} />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 18,
  },
  card: {
    width: "min(520px, 92vw)",
    border: "1px solid var(--border)",
    borderRadius: 24,
    boxShadow: `0 12px 40px var(--shadow)`,
    padding: 22,
    background: "white",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  pfp: {
    borderRadius: 999,
    objectFit: "cover",
    border: "1px solid var(--border)",
    background: "#fafafa",
  },
  title: {
    fontSize: 18,
    fontWeight: 800,
    lineHeight: 1.1,
  },
  subtitle: {
    fontSize: 12,
    color: "var(--muted)",
    marginTop: 2,
  },
  shareBtn: {
    border: "1px solid var(--border)",
    background: "white",
    padding: "8px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 700,
  },
  scoreRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 10,
    marginTop: 6,
  },
  score: {
    fontSize: 64,
    fontWeight: 900,
    letterSpacing: "-2px",
  },
  outOf: {
    fontSize: 18,
    fontWeight: 800,
    color: "var(--muted)",
  },
  bio: {
    marginTop: 8,
    fontSize: 13,
    color: "#333",
    lineHeight: 1.4,
  },
  metaRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 12,
  },
  badge: {
    border: "1px solid var(--border)",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    color: "#444",
    background: "#fafafa",
  },
  breakdown: {
    marginTop: 16,
    borderTop: "1px solid var(--border)",
    paddingTop: 16,
  },
  breakTitle: {
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 10,
  },
  notes: {
    fontSize: 12,
    color: "#555",
    lineHeight: 1.5,
    marginTop: 6,
  },
  mintBtn: {
    width: "min(520px, 92vw)",
    borderRadius: 16,
    border: "2px solid #111",
    background: "#111",
    color: "white",
    padding: "14px 16px",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
  },
  error: {
    width: "min(520px, 92vw)",
    color: "#b00020",
    fontSize: 12,
    lineHeight: 1.4,
  },
  muted: {
    color: "var(--muted)",
    fontSize: 13,
  },
  mutedSmall: {
    color: "var(--muted)",
    fontSize: 12,
  },
};
