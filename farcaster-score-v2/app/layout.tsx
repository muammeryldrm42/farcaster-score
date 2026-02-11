import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Farcaster Score",
  description: "Mint your Farcaster Score (0–100) on Base.",
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
