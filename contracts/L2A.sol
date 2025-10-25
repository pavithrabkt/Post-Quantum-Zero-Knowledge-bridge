// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBridgeVerifier {
    function verifyProof(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint256[2] calldata input  // ✅ updated from [1] → [2]
    ) external returns (bool);
}

contract L2A {
    mapping(address => uint256) public balances;
    address public verifier;

    event TransferInitiated(address indexed sender, address indexed receiver, uint256 amount);

    constructor(address _verifier) {
        verifier = _verifier;
        balances[msg.sender] = 1000;
    }

    function bridgeTransfer(
        address receiver,
        uint amount,
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint256[2] calldata input  // ✅ updated
    ) public {
        IBridgeVerifier v = IBridgeVerifier(verifier);
        require(v.verifyProof(a, b, c, input), "Invalid ZK Proof");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;
        emit TransferInitiated(msg.sender, receiver, amount);
    }
}
