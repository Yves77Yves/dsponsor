// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

interface IDSponsorNFTBase {
    error AmountValueTooLow(uint256 value);
    error CannotBeZeroAddress();
    error ForbiddenCurrency(address currency);
    error ForbiddenControllerOperation();
    error InvalidTokenId(uint256 tokenId);
    error InvalidERC20Transfer();
    error MaxSupplyExceeded();

    error MaxSupplyShouldBeGreaterThan0();

    event MintPriceChange(
        address indexed currency,
        bool indexed enabled,
        uint256 indexed amount
    );

    event Mint(
        address indexed currency,
        uint256 indexed amount,
        address tokenOwner,
        string indexed referralData,
        address msgSender,
        uint256 tokenId
    );

    function payAndMint(
        address currency,
        address tokenOwner,
        string calldata referralData
    ) external payable;

    function setBaseURI(string calldata _baseURI) external;

    function setContractURI(string calldata _contractURI) external;

    function setPrice(
        address currency,
        bool enabled,
        uint256 amount
    ) external;

    function setRoyalty(uint96 fee) external;

    function setTokenURI(uint256 tokenId, string calldata _tokenURI) external;

    function getContractURI() external view returns (string memory);

    function getController() external view returns (address);

    function getMaxSupply() external view returns (uint256);

    function getTreasury() external view returns (address payable);

    function getMintPriceForCurrency(address currency)
        external
        view
        returns (bool enabled, uint256 amount);

    function totalSupply() external view returns (uint256);

    function uri(uint256 tokenId) external view returns (string memory);
}

interface IDSponsorNFT is IDSponsorNFTBase, IERC721, IERC2981 {}
