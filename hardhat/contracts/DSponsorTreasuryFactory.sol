// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../node_modules/@openzeppelin/contracts/finance/PaymentSplitter.sol";

/**
 * @title DSponsorTreasury factory
 * @author Anthony Gourraud
 * @notice Create {PaymentSplitter} contract with shares for DSponsor protocol
 */
contract DSponsorTreasuryFactory {
    /// @notice Protocol to receive 4% fees on revenues
    uint256 public constant PROTOCOL_PERCENT_FEE = 4;

    /***
     * @notice This wallet can collect protocol fees from a
     * a {PaymentSplitter} contract
     */
    address public immutable PROTOCOL_ADDRESS_FEE;

    constructor() {
        uint256 chainId = block.chainid;
        PROTOCOL_ADDRESS_FEE = chainId == 1 || // Ethereum
            chainId == 100 || // Gnosis
            chainId == 137 || // Polygon
            chainId == 42161 || // Arbitrum
            chainId == 5 // Goerli
            ? 0x5b15Cbb40Ef056F74130F0e6A1e6FD183b14Cdaf
            : 0x64E8f7C2B4fd33f5E8470F3C6Df04974F90fc2cA;
    }

    /**
     * @param beneficiary Shares funds with DSponsor protocol (96%-4%)
     *
     * @notice Returns a {PaymentSplitter} contract. *
     * A payee should invoke {PaymentSplitter-release} to withdraw.
     * See https://docs.openzeppelin.com/contracts/4.x/api/finance#PaymentSplitter
     */
    function createDSponsorTreasuryFactory(address beneficiary)
        external
        returns (address)
    {
        address[] memory payees = new address[](2);
        payees[0] = beneficiary;
        payees[1] = PROTOCOL_ADDRESS_FEE;
        uint256[] memory shares = new uint256[](2);
        shares[0] = 100 - PROTOCOL_PERCENT_FEE;
        shares[1] = PROTOCOL_PERCENT_FEE;

        return address(new PaymentSplitter(payees, shares));
    }
}
