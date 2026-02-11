# Farcaster Score (Mini App)

A **white-background, single-card** Farcaster Mini App:
- Auto-loads the viewer's Farcaster account when opened **inside Farcaster/Warpcast**
- Shows a **0–100 heuristic score** (computed from free/public Hub data)
- One button under the card: **Mint 0.0001 ETH** (Base)
- Share link + OG preview: `/u/<fid>`

---

## 0) What you need
- GitHub + Vercel
- A deployed NFT contract (included in `contracts/`), then set its address in Vercel env.

---

## 1) Local sanity check (optional but recommended)
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in a normal browser:
- It will tell you to open in Farcaster (expected).
- Open `http://localhost:3000/u/2` to see a public card.

---

## 2) Deploy to Vercel
1) Push this folder to a new GitHub repo
2) Import to Vercel
3) Set environment variables in Vercel → Project → Settings → Environment Variables:

### Required (for score + embeds)
- `NEXT_PUBLIC_APP_URL` = `https://YOUR_VERCEL_DOMAIN`
  - Example: `https://farcaster-score.vercel.app`

### Optional (Hub provider)
- `HUB_HTTP_URL` = `https://hub.pinata.cloud`
  - (default already)

### Required (for mint)
- `NEXT_PUBLIC_CONTRACT_ADDRESS` = `0x...` (your deployed FarcasterScore contract)

Then redeploy.

---

## 3) Deploy the contract (Base)
Open `contracts/README.md` and deploy **FarcasterScore.sol**.
Treasury (mint revenue) is already set to:
`0xB68caDE785359874280859d1650d9Ad92315B916`

After deployment, put the contract address into:
- `NEXT_PUBLIC_CONTRACT_ADDRESS`

---

## 4) Make Farcaster auto-open + “official”
To be recognized as a Mini App, you must host a manifest at:

`/.well-known/farcaster.json`

This repo already includes a template at:
`public/.well-known/farcaster.json`

You MUST:
- Replace `https://YOUR_DOMAIN/...` with your real domain
- Generate `accountAssociation` fields using Farcaster's manifest tool:
  - https://farcaster.xyz/~/developers/mini-apps/manifest

Docs: miniapps.farcaster.xyz → Publishing & Specification.

---

## 5) Sharing + OG preview
- Share URL: `/u/<fid>`
- OG image: `/api/og?fid=<fid>`

Inside Farcaster, the page includes a `fc:miniapp` embed meta tag so it renders as a rich card and opens the Mini App.

---

## Notes on the score
Farcaster Hub HTTP APIs are paginated **without total counts**, so the score uses **sample-based** signals:
- up to 100 casts, 100 likes, 100 followers, 100 following (per request)

This keeps it free and fast on Vercel, but it’s intentionally a heuristic.
