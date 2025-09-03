// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract L2A {
    event AssetLocked(
        bytes32 commitment,   // Poseidon hash of tx data
        address sender,
        address receiver,
        uint256 amount,
        uint256 nonce
    );

    // Store latest Merkle root (updated off-chain by relay)
    bytes32 public latestRoot;

    // Lock assets (simulation only — no actual ERC20/ETH transfer here)
    function lockAsset(
        address _receiver,
        uint256 _amount,
        uint256 _nonce,
        bytes32 _commitment,
        bytes32 _newRoot
    ) external {
        // Update the Merkle root that relay/ZKP will check against
        latestRoot = _newRoot;

        emit AssetLocked(_commitment, msg.sender, _receiver, _amount, _nonce);
    }
}
