// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IDSponsorNFTBase} from "./interfaces/IDSponsorNFT.sol";

import "./lib/ContextMixin.sol";

import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";
import "../node_modules/@openzeppelin/contracts/utils/Strings.sol";

import "../node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";

import "../node_modules/@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DSponsorNFT
 * @author Anthony Gourraud & Yves Spielmann
 * @notice This is an NFT (ERC721) contract
 * with ERC20 pricing and ERC2981 royalties implementations.
 *
 * Controller can set the minting price for any currency
 * (fixed amount of wei or ERC20 tokens) and can disable a currency at any time. *
 * A treasury receives funds from mint and secondary royalties sales
 */
contract DSponsorNFT is
    ContextMixin,
    ERC721Royalty,
    IDSponsorNFTBase,
    ReentrancyGuard
{
    struct MintPriceSettings {
        bool enabled;
        uint256 amount;
    }

    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    using Strings for uint256;

    /// @notice Maximum number of tokens to mint
    uint256 public immutable MAX_SUPPLY;

    /// @notice Where goes funds from mint and second sales royalties
    address payable public immutable TREASURY;

    /// @notice Controller can set NFT parameters (token URI, mint prices, ...)
    address public immutable CONTROLLER;

    /** @notice Opensea-comptatible storefront-level metadata for your contract,
     * only `controller` can modify this value
     * See https://docs.opensea.io/docs/contract-level-metadata
     */
    string public contractURI;

    /** @notice Opensea-comptatible off-chain metadata for each ERC721 token,
     * only `controller` can modify this value
     * See https://docs.opensea.io/docs/metadata-standards
     */
    string public baseURI;

    mapping(uint256 => string) private _tokenURIs;

    Counters.Counter private _tokenIds;

    MintPriceSettings private _mintNativePrice = MintPriceSettings(false, 0);
    mapping(IERC20 => MintPriceSettings) private _mintERC20Prices;

    /* ****************
     *  MODIFIERS
     *****************/

    modifier onlyController() {
        if (_msgSender() != CONTROLLER) revert ForbiddenControllerOperation();
        _;
    }

    /* ****************
     *  CONTRACT CONSTRUCTOR
     *****************/

    /**
     * @param name ERC721 name
     * @param symbol ERC721 symbol
     * @param maxSupply The max number of mintable ERC721 tokens
     * @param controller Admin address to set prices & base uris. Cannot be changed later
     * @param treasury Address to send funds from sales
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 maxSupply,
        address controller,
        address payable treasury
    ) ERC721(name, symbol) {
        if (maxSupply == 0) revert MaxSupplyShouldBeGreaterThan0();
        if (controller == address(0)) revert CannotBeZeroAddress();
        if (treasury == address(0)) revert CannotBeZeroAddress();

        MAX_SUPPLY = maxSupply;
        CONTROLLER = controller;
        TREASURY = treasury;
    }

    /* ******************
     *  EXTERNAL FUNCTIONS
     ********************/

    /**
     * @notice Mint one token if succeed to pay with provided `currency`, and transfer to `tokenOwner`
     * @param currency ERC20 contract address to spend tokens, 0 for native
     * @param tokenOwner Transfer minted token to this address
     * @param referralData Optionnal referral information (referrer address, campaign attribution, ...)
     * @dev External calls considerations :
     * - `currency` should be enabled : {getMintPriceForCurrency} gives the `enabled` information.
     * - Will revert if the contract cannot transfer corresponding price `amount`
     * (deployed contract needs spending allowance if `currency` is ERC20, see {IERC20-approve})
     * - Reentrency protection against {Address-sendValue},
     * {ERC721-_safeMint}, ({IERC721Receiver-onERC721Received}), and{IERC20-safeTransferFrom}
     *
     * Emits a {Mint} and {IERC721-Transfer} events.
     */
    function payAndMint(
        address currency,
        address tokenOwner,
        string calldata referralData
    ) external payable nonReentrant {
        if (tokenOwner == address(0)) revert CannotBeZeroAddress();

        (bool enabled, uint256 amount) = getMintPriceForCurrency(currency);
        if (!enabled) revert ForbiddenCurrency(currency);

        if (currency == address(0) && msg.value < amount)
            revert AmountValueTooLow(msg.value);

        if (amount > 0) {
            if (currency == address(0)) Address.sendValue(TREASURY, amount);
            else {
                /*
                 * @dev Controller is responsible to set a valid contract as currency.
                 * If this function does not revert, we assume it transfered tokens as expected
                 */
                IERC20(currency).safeTransferFrom(
                    _msgSender(),
                    TREASURY,
                    amount
                );
            }
        }

        uint256 tokenId = totalSupply();
        _safeMint(tokenOwner, tokenId);

        emit Mint(
            currency,
            amount,
            tokenOwner,
            referralData,
            _msgSender(),
            tokenId
        );
    }

    /**
     * @param _baseURI Recommandation : IPFS JSON files {baseURI}/{tokenId} with
     * description, external_url, image, name and attributes keys
     * */
    function setBaseURI(string calldata _baseURI) external onlyController {
        baseURI = _baseURI;
    }

    /**
     * @param _contractURI Recommandation : IPFS JSON file with name, description, image,
     * external_link, seller_fee_basis_points, and fee_recipient keys
     */
    function setContractURI(string calldata _contractURI)
        external
        onlyController
    {
        contractURI = _contractURI;
    }

    /** @param currency ERC20 contract address or 0 for native coin
     *  @param enabled Allow / disallow minting sale with provided `currency`
     *  @param amount How much user will have to pay to mint one token - can be 0
     *  @dev As `CONTROLLER` could allow an contract as currency with malicious
     * {IERC20-transferFrom} or {IERC20-transfer} functions,
     * `TREASURY` should consider trusted ERC20 contracts only to collect fees.
     *
     * Emits a {MintPriceChange} event.
     */
    function setPrice(
        address currency,
        bool enabled,
        uint256 amount
    ) external onlyController {
        if (currency != address(0)) {
            _mintERC20Prices[IERC20(currency)] = MintPriceSettings(
                enabled,
                amount
            );
        } else {
            _mintNativePrice = MintPriceSettings(enabled, amount);
        }

        emit MintPriceChange(currency, enabled, amount);
    }

    /**
     * @param fee ERC2981 feeNumerator (feeDenominator = 10000, 1% fee if `royaltyFraction` = 100)
     */
    function setRoyalty(uint96 fee) external onlyController {
        _setDefaultRoyalty(TREASURY, fee);
    }

    // @dev We allow to set value for tokens that are not minted yet
    function setTokenURI(uint256 tokenId, string calldata _tokenURI)
        external
        onlyController
    {
        if (MAX_SUPPLY <= tokenId) revert InvalidTokenId(tokenId);
        _tokenURIs[tokenId] = _tokenURI;
    }

    /* ****************
     *  EXTERNAL  GETTERS
     *****************/

    function getContractURI() external view returns (string memory) {
        return contractURI;
    }

    function getController() external view returns (address) {
        return CONTROLLER;
    }

    function getMaxSupply() external view returns (uint256) {
        return MAX_SUPPLY;
    }

    function getTreasury() external view returns (address payable) {
        return TREASURY;
    }

    // @dev URI OpenSea traits compatibility.
    function uri(uint256 tokenId) external view returns (string memory) {
        return tokenURI(tokenId);
    }

    /* ****************
     *  PUBLIC GETTERS
     *****************/

    function getMintPriceForCurrency(address currency)
        public
        view
        returns (bool enabled, uint256 amount)
    {
        MintPriceSettings memory mintPriceSettings = currency != address(0)
            ? _mintERC20Prices[IERC20(currency)]
            : _mintNativePrice;

        enabled = mintPriceSettings.enabled;
        amount = mintPriceSettings.amount;
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }

    /* ****************
     *  PUBLIC OVERRIDE GETTERS
     *****************/

    function isApprovedForAll(address _owner, address _operator)
        public
        view
        override
        returns (bool isOperator)
    {
        /* @dev On Polygon (Main Network), if OpenSea's ERC721 Proxy Address is detected,
         * auto-return true. Otherwise, use the default ERC721.isApprovedForAll()
         * See https://docs.opensea.io/docs/polygon-basic-integration
         */
        if (
            block.chainid == 137 &&
            _operator == address(0x58807baD0B376efc12F5AD86aAc70E78ed67deaE)
        ) {
            return true;
        }
        return ERC721.isApprovedForAll(_owner, _operator);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        _requireMinted(tokenId);

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = baseURI;

        // @dev If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return bytes(_tokenURI).length == 0 ? "" : _tokenURI;
        }

        // @dev If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }

        // @dev If there is a baseURI but no tokenURI, concatenate the tokenID to the baseURI.
        return string(abi.encodePacked(base, tokenId.toString()));
    }

    /* ****************
     *  OVERRIDE FUNCTIONS
     *****************/

    /* @dev Used instead of msg.sender as transactions won't be sent
     * by the original token owner, but by relayer.
     * See Opensea meta tx : https://docs.opensea.io/docs/polygon-basic-integration
     */
    function _msgSender() internal view override returns (address sender) {
        return ContextMixin.msgSender();
    }

    function _safeMint(address to, uint256 tokenId) internal override(ERC721) {
        // @dev _safeMint is called by payAndMint() only, tokenId is from Counters.Counter
        if (MAX_SUPPLY <= tokenId) revert MaxSupplyExceeded();

        super._safeMint(to, tokenId);
        _tokenIds.increment();
    }
}
