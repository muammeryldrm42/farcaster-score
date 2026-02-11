export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined) ??
  (undefined as any);

export const MINT_PRICE_WEI = 100000000000000n; // 0.0001 ether

export const CONTRACT_ABI = [
  {
    type: "function",
    name: "mint",
    stateMutability: "payable",
    inputs: [
      { name: "fid", type: "uint256" },
      { name: "score", type: "uint16" }
    ],
    outputs: [{ name: "tokenId", type: "uint256" }]
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }]
  },
  {
    type: "function",
    name: "treasury",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }]
  },
  {
    type: "function",
    name: "mintPrice",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;
