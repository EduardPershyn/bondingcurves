// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.9;

import "../BcToken.sol";

contract TestToken is BcToken {

    event Debug(uint sp, uint bp);

    constructor() BcToken("BcToken", "BCT", 1) {

    }

    function testBalance() public {
        assert( getSellPrice(totalSupply()) <= address(this).balance);
    }

    function testPrice(uint256 amount) public {
        uint256 total = totalSupply();
        amount = total < amount ? total : amount;

        uint sp = getSellPrice(amount);
        uint bp = getBuyPrice(amount);

        emit Debug(sp, bp);

        assert( sp <= bp );
    }

    function testMint(uint256 amount) external payable {
        uint256 buyPrice = getBuyPrice(amount);
        uint256 balanceBefore = balanceOf(msg.sender);

        super.mint(amount, buyPrice);

        assert(balanceBefore < balanceOf(msg.sender));
    }

    function testBurn(uint256 amount) external {
        uint256 sellPrice = getSellPrice(amount);
        uint256 balanceBefore = balanceOf(msg.sender);

        super.burn(amount, sellPrice, sellPrice);

        assert(balanceBefore > balanceOf(msg.sender));
    }
}
