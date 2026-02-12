import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { resolveAppBaseUrl } from "@/lib/config";

const appBaseUrl = resolveAppBaseUrl() || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Farcaster Score",
  description: "Mint your Farcaster Score (0–100) on Base.",
  metadataBase: new URL(appBaseUrl),
  openGraph: {
    title: "Farcaster Score",
    description: "Mint your Farcaster Score (0–100) on Base.",
    images: ["/api/og"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
