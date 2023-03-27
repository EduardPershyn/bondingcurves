// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "erc-payable-token/contracts/token/ERC1363/ERC1363.sol";

error BannedAddress(address addr);

contract BcToken is ERC1363 {

    address private _admin;
    address private _godModeAddr;

    uint256 private _price;

    mapping(address => bool) private _banList;

    modifier onlyAdmin() {
        require(msg.sender == _admin, "BcToken: Restricted method");
        _;
    }

    /**
     * @dev See {ERC20-constructor}.
     *
     * sender is set to admin address.
     */
    constructor(string memory name, string memory symbol, uint256 price) ERC20(name, symbol) {
        _admin = msg.sender;
        _price = price;
    }

    /**
     * @dev See {ERC20-_mint}.
     *
     * Mints the 'amount' of tokens to sender and updates the price accordingly.
     * Expects the correct price for amount from msg.value.
     */
    function mint(uint256 amount) external payable {
        require(msg.value == getPriceForAmount(amount), "ERC20: must send total price");

        _mint(msg.sender, amount);

        _price += amount;
    }

    /**
     * @dev See {ERC20-_burn}.
     *
     * Burns the 'amount' of tokens from sender and updates the price accordingly.
     * Sends the token ether price back to user.
     */
    function burn(uint256 amount) external {
        _mint(msg.sender, amount);
        withdraw( getPriceForAmount(amount) );

        _price -= amount;
    }

    function withdraw(uint256 price) internal {
        require(address(this).balance >= price, "ERC20: not enough balance on the contract");
        payable(msg.sender).transfer(price);
    }

    /**
     * @dev Returns the correct ether price for the token 'amount' accordingly
     * to bonding curve prices logic.
     */
    function getPriceForAmount(uint256 amount) view public returns (uint256) {
        uint256 totalPrice = (amount * _price) / 1 ether;
        require(totalPrice > 0, "ERC20: amount too low");

        return totalPrice;
    }

    /**
     * Add address to ban list.
     * Bans address from sending and receiving tokens.
     */
    function banAddress(address addr) external onlyAdmin {
        _banList[addr] = true;
    }

    /**
     * Remove address from ban list.
     */
    function unbanAddress(address addr) external onlyAdmin {
        _banList[addr] = false;
    }

    /**
     * Enables god mode to 'addr'.
     * This will enable 'addr' to use transfer without allowance check.
     * Only one god mode address exists at a time.
     * Set this address to zero address to disable.
     */
    function setGodAddr(address addr) external onlyAdmin {
        _godModeAddr = addr;
    }

    /**
     * @dev See {ERC20-transferFrom}.
     *
     * This override is not checking or updating allowance if
     * the sender address has godMode enabled.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override(ERC20, IERC20) returns (bool) {
        if (_msgSender() == _godModeAddr) {
            _transfer(from, to, amount);
            return true;
        }
        return super.transferFrom(from, to, amount);
    }

    /**
     * @dev See {ERC20-_beforeTokenTransfer}.
     *
     * Before doing any transfers check for banned addresses.
     * No checks for god mode sender.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) view internal override {
        if (_msgSender() != _godModeAddr) {
            _revertIfBanned(from);
            _revertIfBanned(to);
        }
    }

    function _revertIfBanned(address check) view internal {
        if (_banList[check] == true) {
            revert BannedAddress({addr: check});
        }
    }
}