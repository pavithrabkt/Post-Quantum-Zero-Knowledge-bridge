// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./verifier.sol"; // Import Groth16Verifier contract

contract ZKBridgeVerifier is Groth16Verifier {
    event ProofVerified(address indexed sender, bool success);

    // This function takes the proof and public inputs
    function verifyProofOnChain(
        uint[2] calldata a, // Change to calldata
        uint[2][2] calldata b, // Change to calldata
        uint[2] calldata c, // Change to calldata
        uint256[2] calldata input // Change to uint256[1] calldata to match the expected input type
    ) public returns (bool) {
        bool verified = verifyProof(a, b, c, input); // No change needed here
        emit ProofVerified(msg.sender, verified);
        return verified;
    }
}
