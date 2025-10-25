pragma circom 2.2.2;

include "node_modules/circomlib/circuits/poseidon.circom";

template MerkleProof(depth) {
    signal input leaf;
    signal input pathElements[depth];
    signal input pathIndices[depth];
    signal input root;

    component hash_pair[depth];
    signal currentHash[depth + 1];
    signal left[depth];
    signal right[depth];

    // Declare selector helper signals outside the loop
    signal selLeft1[depth];
    signal selLeft2[depth];
    signal selRight1[depth];
    signal selRight2[depth];

    currentHash[0] <== leaf;

    for (var i = 0; i < depth; i++) {
        // Ensure pathIndices[i] is binary (0 or 1)
        pathIndices[i] * (pathIndices[i] - 1) === 0;

        // Select left/right based on pathIndices[i]
        selLeft1[i] <== (1 - pathIndices[i]) * currentHash[i];
        selLeft2[i] <== pathIndices[i] * pathElements[i];
        left[i] <== selLeft1[i] + selLeft2[i];

        selRight1[i] <== pathIndices[i] * currentHash[i];
        selRight2[i] <== (1 - pathIndices[i]) * pathElements[i];
        right[i] <== selRight1[i] + selRight2[i];

        // Hash the pair
        hash_pair[i] = Poseidon(2);
        hash_pair[i].inputs[0] <== left[i];
        hash_pair[i].inputs[1] <== right[i];

        currentHash[i + 1] <== hash_pair[i].out;
    }

    // Check computed root
    root === currentHash[depth];
}

template Transfer(depth) {
    // private inputs
    signal input sender;
    signal input receiver;
    signal input amount;
    signal input nonce;
    signal input pathElements[depth];
    signal input pathIndices[depth];

    // public inputs
    signal input root;
    signal input nullifier;

    // txHash = Poseidon(sender, receiver, amount, nonce)
    component txHash = Poseidon(4);
    txHash.inputs[0] <== sender;
    txHash.inputs[1] <== receiver;
    txHash.inputs[2] <== amount;
    txHash.inputs[3] <== nonce;

    // prove inclusion of txHash in Merkle tree
    component merkleProof = MerkleProof(depth);
    merkleProof.leaf <== txHash.out;
    merkleProof.root <== root;
    for (var i = 0; i < depth; i++) {
        merkleProof.pathElements[i] <== pathElements[i];
        merkleProof.pathIndices[i] <== pathIndices[i];
    }

    // recompute nullifier = Poseidon(txHash.out, nonce)
    component nf = Poseidon(2);
    nf.inputs[0] <== txHash.out;
    nf.inputs[1] <== nonce;
    nf.out === nullifier;
}

// Expose both root and nullifier as public inputs
component main {public [root, nullifier]} = Transfer(3);
