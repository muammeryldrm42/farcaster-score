// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * Farcaster Score
 * - Unlimited paid mints (0.0001 ETH)
 * - Stores (fid, score) per token
 * - On-chain tokenURI (base64 JSON)
 * - Treasury set to the deployer-provided wallet (Muammer)
 */
contract FarcasterScore is ERC721, Ownable {
    using Strings for uint256;

    error WrongPrice();

    uint256 public constant mintPrice = 0.0001 ether;
    address public immutable treasury;

    uint256 private _nextId = 1;

    struct ScoreData {
        uint256 fid;
        uint16 score;
    }

    mapping(uint256 => ScoreData) public scoreByTokenId;

    event Minted(address indexed minter, uint256 indexed tokenId, uint256 fid, uint16 score, uint256 pricePaid);
    event TreasuryPayoutDeferred(uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    constructor(address _treasury) ERC721("Farcaster Score", "FCSCORE") Ownable(msg.sender) {
        treasury = _treasury;
    }

    function mint(uint256 fid, uint16 score) external payable returns (uint256 tokenId) {
        if (msg.value != mintPrice) revert WrongPrice();

        tokenId = _nextId++;
        _safeMint(msg.sender, tokenId);
        scoreByTokenId[tokenId] = ScoreData({ fid: fid, score: score });

        // Attempt immediate payout to treasury; if it fails, keep funds in the contract
        // so minting still succeeds and owner can later recover with withdraw().
        (bool ok, ) = treasury.call{ value: msg.value }("");
        if (!ok) {
            emit TreasuryPayoutDeferred(msg.value);
        }

        emit Minted(msg.sender, tokenId, fid, score, msg.value);
    }

    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        (bool ok, ) = treasury.call{ value: bal }("");
        require(ok, "withdraw failed");
        emit Withdrawn(treasury, bal);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "nonexistent token");
        ScoreData memory s = scoreByTokenId[tokenId];

        string memory name = string.concat("Farcaster Score #", tokenId.toString());
        string memory description = "Farcaster Score (0-100) minted on Base. Score is a heuristic computed from public Farcaster Hub data at mint time.";
        string memory attributes = string.concat(
            '[{"trait_type":"fid","value":"', s.fid.toString(), '"},',
            '{"trait_type":"score","value":"', uint256(s.score).toString(), '"}]'
        );

        // Simple SVG image on-chain
        string memory svg = string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">',
              '<rect width="1200" height="800" fill="#ffffff"/>',
              '<rect x="60" y="60" width="1080" height="680" rx="48" fill="#ffffff" stroke="#111111" stroke-width="6"/>',
              '<text x="120" y="200" font-family="Arial" font-size="64" font-weight="700" fill="#111111">Farcaster Score</text>',
              '<text x="120" y="290" font-family="Arial" font-size="36" fill="#444444">FID ', s.fid.toString(), '</text>',
              '<text x="120" y="470" font-family="Arial" font-size="160" font-weight="800" fill="#111111">', uint256(s.score).toString(), '</text>',
              '<text x="370" y="470" font-family="Arial" font-size="48" font-weight="700" fill="#666666">/ 100</text>',
              '<text x="120" y="620" font-family="Arial" font-size="34" fill="#666666">mint price: 0.0001 ETH</text>',
            '</svg>'
        );

        string memory image = string.concat("data:image/svg+xml;base64,", Base64.encode(bytes(svg)));

        bytes memory jsonBytes = abi.encodePacked(
            '{',
              '"name":"', name, '",',
              '"description":"', description, '",',
              '"image":"', image, '",',
              '"attributes":', attributes,
            '}'
        );

        return string.concat("data:application/json;base64,", Base64.encode(jsonBytes));
    }
}
