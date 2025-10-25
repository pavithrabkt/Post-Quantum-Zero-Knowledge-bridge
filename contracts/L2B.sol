// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract L2B {
    mapping(address => uint256) public balances;

    event TransferReceived(address indexed from, address indexed to, uint256 amount);

    function receiveFromBridge(address from, address to, uint256 amount) public {
        balances[to] += amount;
        emit TransferReceived(from, to, amount);
    }
}
