// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../../node_modules/@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import "../interfaces/IDSponsorNFT.sol";

contract Reentrant is ERC20 {
    constructor() ERC20("Reentrant", "Reentrant") {}

    bool entered = false;

    receive() external payable virtual {
        IDSponsorNFT nftContract = IDSponsorNFT(msg.sender);
        if (!entered) {
            entered = true;
            nftContract.payAndMint(address(0), address(this), "");
        }
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool ret) {
        require(from != address(0) && amount != 0, "invalid transfer from...");
        ret = true;
        IDSponsorNFT nftContract = IDSponsorNFT(msg.sender);
        if (!entered) {
            entered = true;
            nftContract.payAndMint(address(this), to, "");
        }
    }

    /*
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
    */
}
