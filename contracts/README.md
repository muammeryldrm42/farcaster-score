# Contract: FarcasterScore.sol

This folder is **optional** for the Vercel site. It's here so you can deploy the mint contract.

## What it does
- ERC-721 NFT
- Unlimited paid mints
- Mint price: **0.0001 ETH**
- Network: **Base**
- Treasury (mint revenue): **0xB68caDE785359874280859d1650d9Ad92315B916**
- Stores `fid` + `score` inside the NFT metadata (on-chain tokenURI)

## Fastest deploy (Remix)
1) Open Remix (Solidity).
2) Create a file `FarcasterScore.sol` and paste the contract code.
3) Replace the import paths with GitHub imports (Remix supports them), e.g.:
   - `https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721.sol`
   - `https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol`
   - `https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Base64.sol`
   - `https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Strings.sol`
4) Compile with Solidity **0.8.24**.
5) Deploy on **Base** with constructor arg:
   - `0xB68caDE785359874280859d1650d9Ad92315B916`

## After deploy
Copy the deployed contract address and set it in the web app:
- `NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContract`

Then redeploy Vercel.
