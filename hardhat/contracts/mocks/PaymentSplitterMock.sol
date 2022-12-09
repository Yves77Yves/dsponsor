// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/finance/PaymentSplitter.sol";

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PaymentSplitterMock is PaymentSplitter {
    constructor(address[] memory payees, uint256[] memory shares_)
        PaymentSplitter(payees, shares_)
    {}
}
