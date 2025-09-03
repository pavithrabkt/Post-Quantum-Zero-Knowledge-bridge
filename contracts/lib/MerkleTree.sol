// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IPoseidon.sol";

library MerkleTree {
    struct Tree {
        uint32 depth;
        uint32 nextIndex;
        // nodes[level][index] => value
        mapping(uint32 => mapping(uint32 => bytes32)) nodes;
        mapping(uint32 => bytes32) zeros; // default zero values per level
        bytes32 root;
    }

    /// @notice initialize tree with Poseidon-derived zero values
    function init(Tree storage self, IPoseidon poseidon, uint32 _depth) internal {
        require(_depth > 0 && _depth < 64, "Invalid depth");
        self.depth = _depth;
        self.nextIndex = 0;

        // compute zero for level 0 as poseidon([0,0,0,0])
        uint256 z = poseidon.poseidon([uint256(0), uint256(0), uint256(0), uint256(0)]);
        self.zeros[0] = bytes32(z);

        // compute higher-level zeros: zero_{i+1} = poseidon([zero_i, zero_i, 0, 0])
        for (uint32 i = 0; i < _depth - 1; i++) {
            uint256 zi = uint256(self.zeros[i]);
            uint256 zi1 = poseidon.poseidon([zi, zi, uint256(0), uint256(0)]);
            self.zeros[i + 1] = bytes32(zi1);
        }

        // set root to the top zero
        self.root = self.zeros[_depth - 1];
    }

    /// @notice insert a leaf and recompute the path up to root using Poseidon
    function insert(Tree storage self, IPoseidon poseidon, bytes32 leaf) internal returns (bytes32) {
        uint32 index = self.nextIndex;
        self.nextIndex += 1;

        // store leaf at level 0
        self.nodes[0][index] = leaf;

        bytes32 current = leaf;
        uint32 idx = index;

        for (uint32 level = 0; level < self.depth; level++) {
            uint32 pairIndex;
            bytes32 pair;

            if (idx % 2 == 0) {
                // current is left, sibling is at idx+1
                pairIndex = idx + 1;
                pair = self.nodes[level][pairIndex];
                if (pair == bytes32(0)) pair = self.zeros[level];
                // parent = poseidon(left, right, 0, 0)
                uint256 parentNum = poseidon.poseidon([uint256(current), uint256(pair), uint256(0), uint256(0)]);
                bytes32 parent = bytes32(parentNum);
                self.nodes[level + 1][idx / 2] = parent;
                current = parent;
            } else {
                // current is right, sibling is at idx-1
                pairIndex = idx - 1;
                pair = self.nodes[level][pairIndex];
                if (pair == bytes32(0)) pair = self.zeros[level];
                uint256 parentNum = poseidon.poseidon([uint256(pair), uint256(current), uint256(0), uint256(0)]);
                bytes32 parent = bytes32(parentNum);
                self.nodes[level + 1][idx / 2] = parent;
                current = parent;
            }

            idx = idx / 2;
        }

        // update root
        self.root = current;
        return current;
    }

    /// @notice returns current root
    function root(Tree storage self) internal view returns (bytes32) {
        return self.root;
    }

    /// @notice helper: get leaf value at index (level 0)
    function getLeaf(Tree storage self, uint32 index) internal view returns (bytes32) {
        return self.nodes[0][index];
    }

    /// @notice Simple proof generator (returns sibling elements & indices) - for demo only
    /// Note: This implementation reads nodes stored; it's not an optimized or gas-minimal proof routine.
    function getProof(Tree storage self, uint32 leafIndex) internal view returns (bytes32[] memory, uint8[] memory) {
        uint32 idx = leafIndex;
        bytes32[] memory siblings = new bytes32[](self.depth);
        uint8[] memory pathIndices = new uint8[](self.depth);

        for (uint32 level = 0; level < self.depth; level++) {
            uint32 siblingIndex;
            bytes32 sibling;
            if (idx % 2 == 0) {
                siblingIndex = idx + 1;
            } else {
                siblingIndex = idx - 1;
            }
            sibling = self.nodes[level][siblingIndex];
            if (sibling == bytes32(0)) sibling = self.zeros[level];

            siblings[level] = sibling;
            pathIndices[level] = uint8(idx % 2);
            idx = idx / 2;
        }

        return (siblings, pathIndices);
    }
}
