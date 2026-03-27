// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/token/ERC721/ERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/utils/Base64.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/utils/Strings.sol";

contract FarcasterScore is ERC721, Ownable {
    using Strings for uint256;

    error WrongPrice();
    error InvalidScore();
    error InvalidFid();
    error WithdrawFailed();

    uint256 public constant mintPrice = 0.0001 ether;

    // owner + fee wallet
    address public constant treasury = 0xB68caDE785359874280859d1650d9Ad92315B916;

    uint256 private _nextId = 1;

    struct ScoreData {
        uint256 fid;
        uint16 score;
    }

    mapping(uint256 => ScoreData) public scoreByTokenId;

    event Minted(
        address indexed minter,
        uint256 indexed tokenId,
        uint256 fid,
        uint16 score,
        uint256 pricePaid
    );

    event TreasuryPayoutDeferred(uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    constructor() ERC721("Farcaster Score", "FCSCORE") Ownable(treasury) {}

    function mint(uint256 fid, uint16 score) external payable returns (uint256 tokenId) {
        if (msg.value != mintPrice) revert WrongPrice();
        if (fid == 0) revert InvalidFid();
        if (score > 100) revert InvalidScore();

        tokenId = _nextId++;
        _safeMint(msg.sender, tokenId);

        scoreByTokenId[tokenId] = ScoreData({
            fid: fid,
            score: score
        });

        // Direkt treasury'ye göndermeyi dener.
        // Başarısız olursa mint bozulmaz; para kontratta kalır.
        (bool ok, ) = treasury.call{value: msg.value}("");
        if (!ok) {
            emit TreasuryPayoutDeferred(msg.value);
        }

        emit Minted(msg.sender, tokenId, fid, score, msg.value);
    }

    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        (bool ok, ) = treasury.call{value: bal}("");
        if (!ok) revert WithdrawFailed();

        emit Withdrawn(treasury, bal);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "nonexistent token");

        ScoreData memory s = scoreByTokenId[tokenId];

        string memory name = string.concat("Farcaster Score #", tokenId.toString());
        string memory description =
            "Farcaster Score (0-100) minted on Base. Score is stored on-chain.";

        string memory attributes = string.concat(
            '[{"trait_type":"fid","value":"', s.fid.toString(),
            '"},{"trait_type":"score","value":"', uint256(s.score).toString(),
            '"}]'
        );

        string memory svg = string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">',
            '<rect width="1200" height="800" fill="#ffffff"/>',
            '<rect x="60" y="60" width="1080" height="680" rx="48" fill="#ffffff" stroke="#111111" stroke-width="6"/>',
            '<text x="120" y="200" font-family="Arial" font-size="64" font-weight="700" fill="#111111">Farcaster Score</text>',
            '<text x="120" y="290" font-family="Arial" font-size="36" fill="#444444">FID ', s.fid.toString(), '</text>',
            '<text x="120" y="360" font-family="Arial" font-size="120" font-weight="700" fill="#111111">', uint256(s.score).toString(), '</text>',
            '<text x="120" y="430" font-family="Arial" font-size="32" fill="#666666">Minted on Base</text>',
            '</svg>'
        );

        string memory image = string.concat(
            "data:image/svg+xml;base64,",
            Base64.encode(bytes(svg))
        );

        bytes memory dataURI = abi.encodePacked(
            "{",
                '"name":"', name, '",',
                '"description":"', description, '",',
                '"image":"', image, '",',
                '"attributes":', attributes,
            "}"
        );

        return string.concat(
            "data:application/json;base64,",
            Base64.encode(dataURI)
        );
    }
}
