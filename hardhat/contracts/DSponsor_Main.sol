// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "./DSponsor.sol";
import "./DSponsorNFTFactory.sol";
import "./DSponsorTreasuryFactory.sol";

/**
 * @title DSponsor main contract
 * @author Anthony Gourraud & Yves Spielmann
 * @notice Use this contract to create {DSponsor} and {DSponsorNFT} instances,
 * events record guarantees a follow up on activities with the prototcol
 */
contract DSponsorMain {
    DSponsorNFTFactory nftFactory = new DSponsorNFTFactory();
    DSponsorTreasuryFactory treasuryFactory = new DSponsorTreasuryFactory();

    /* ****************
     *  EVENTS DECLARATIONS
     *****************/

    event NewDSponsor(
        address indexed dSponsorAddress,
        address indexed sponsee,
        address indexed nftContract,
        bool nftIsFromDSponsorFactory
    );

    event NewDSponsorNFT(
        address indexed dSponsorNFTAddress,
        address indexed beneficiary,
        address indexed treasury
    );

    /* ****************
     *  EXTERNAL FUNCTIONS
     *****************/

    /**
     * @notice Creates a {DSponsor} contract linked to an ERC721 compliant contract

     * @param ERC721Contract ERC721 compliant contract - 1 token is 1 right / 1 space on sponsoring data
     * @param rulesURI Document with sponsoring conditions. IPFS or Arweave links recommended 
     * @param sponsee Controller who administrate sponsoring
     *
     * Emits {NewDSponsor} event
     */
    function createFromContract(
        IERC721 ERC721Contract,
        string memory rulesURI,
        address sponsee
    ) external {
        _create(ERC721Contract, rulesURI, sponsee, false);
    }

    /**
     * @notice Creates a {DSponsor} contract linked to a new {DSponsorNFT} (ERC721 Compliant)
     * A {PaymentSplitter} treasury will receive funds from
     * the {DSponsorNFT} minting and secondary sales.
     * To withdraw, `sponsee` should use {PaymentSplitter-realease} function,
     * from {DSponsorNFT-getTreasury()} address
     * See https://docs.openzeppelin.com/contracts/4.x/api/finance#PaymentSplitter
     *
     * @param name ERC721 name for NFT contract to create (and to link with sponsoring contract)
     * @param symbol ERC721 symbol for NFT contract to create (and to link with sponsoring contract)
     * @param maxSupply The max number of mintable ERC721 tokens
     *
     * @param rulesURI Document with sponsoring conditions. IPFS or Arweave links recommended
     * @param sponsee Controller who administrate sponsoring and will be able to withdraw funds from sales
     
     *
     * Emits {NewDSponsor} and {NewDSponsorNFT} events
     */
    function createWithNewNFT(
        string memory name,
        string memory symbol,
        uint256 maxSupply,
        string memory rulesURI,
        address sponsee
    ) external {
        address dSponsorNFTAddress = createDSponsorNFT(
            name,
            symbol,
            maxSupply,
            sponsee
        );

        _create(IERC721(dSponsorNFTAddress), rulesURI, sponsee, true);
    }

    /* ****************
     *  PUBLIC FUNCTIONS
     *****************/

    /**
     * @notice Creates a {DSponsorNFT}, an ERC721 compliant contract with native ERC20 pricing for minting sales
     * A {PaymentSplitter} treasury will receive funds from minting and secondary sales.
     * To withdraw, payee should use {PaymentSplitter-realease} function,
     * from {DSponsorNFT-getTreasury()} address
     * See https://docs.openzeppelin.com/contracts/4.x/api/finance#PaymentSplitter
     *
     * @param name ERC721 name for NFT contract to create
     * @param symbol ERC721 for NFT contract to create
     * @param maxSupply The max number of mintable ERC721 tokens
     * @param controller Addresss who administrate NFT pricing and will be able to withdraw funds from sales
     *
     * @return dSponsorNFTAddress The created contract address
     *
     * Emits {NewDSponsorNFT} event
     */
    function createDSponsorNFT(
        string memory name,
        string memory symbol,
        uint256 maxSupply,
        address controller
    ) public returns (address dSponsorNFTAddress) {
        address treasury = treasuryFactory.createDSponsorTreasuryFactory(
            controller
        );
        dSponsorNFTAddress = nftFactory.createDSponsorNFT(
            name,
            symbol,
            maxSupply,
            controller,
            payable(treasury)
        );
        emit NewDSponsorNFT(dSponsorNFTAddress, controller, treasury);
    }

    /* ****************
     *  PRIVATE FUNCTIONS
     *****************/

    function _create(
        IERC721 ERC721Contract,
        string memory rulesURI,
        address sponsee,
        bool nftIsFromDSponsorFactory
    ) private returns (address dSponsorAddress) {
        dSponsorAddress = address(
            new DSponsor(ERC721Contract, rulesURI, sponsee)
        );

        emit NewDSponsor(
            dSponsorAddress,
            sponsee,
            address(ERC721Contract),
            nftIsFromDSponsorFactory
        );
    }
}
