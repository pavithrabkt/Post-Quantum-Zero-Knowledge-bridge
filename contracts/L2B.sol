// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract L2B {
    event AssetUnlocked(
        bytes32 commitment,
        address receiver,
        uint256 amount,
        uint256 nonce
    );

    // Store latest verified root from ZKP module
    bytes32 public latestVerifiedRoot;

    // Called after ZKP verifies proof of inclusion in L2A’s Merkle tree
    function unlockAsset(
        address _receiver,
        uint256 _amount,
        uint256 _nonce,
        bytes32 _commitment,
        bytes32 _verifiedRoot
    ) external {
        // Update state with root that was proven valid
        latestVerifiedRoot = _verifiedRoot;

        emit AssetUnlocked(_commitment, _receiver, _amount, _nonce);
    }
}
