// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "./DSponsorNFT.sol";

/**
 * @title DSponsorNFT factory
 * @author Anthony Gourraud
 * @notice Create {DSponsorNFT} contracts
 */
contract DSponsorNFTFactory {
    function createDSponsorNFT(
        string memory name,
        string memory symbol,
        uint256 maxSupply,
        address controller,
        address payable treasury
    ) external returns (address) {
        return
            address(
                new DSponsorNFT(name, symbol, maxSupply, controller, treasury)
            );
    }
}
