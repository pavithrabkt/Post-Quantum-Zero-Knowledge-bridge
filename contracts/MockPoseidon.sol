// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IPoseidon.sol";

/// @notice Mock Poseidon for local testing — returns keccak-based uint256.
/// Replace with real Poseidon implementation or deployed precompile in production.
contract MockPoseidon is IPoseidon {
    function poseidon(uint256[4] calldata inputs) external pure override returns (uint256) {
        // naive mock: keccak of inputs
        return uint256(keccak256(abi.encodePacked(inputs[0], inputs[1], inputs[2], inputs[3])));
    }
}
