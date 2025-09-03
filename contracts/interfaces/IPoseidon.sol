// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPoseidon {
    /// @notice Poseidon hash function that takes 4 uint256 inputs and returns a single uint256
    /// @dev This matches common poseidon wrappers which expose poseidon(inputs)
    function poseidon(uint256[4] calldata inputs) external pure returns (uint256);
}
