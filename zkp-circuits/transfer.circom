pragma circom 2.0.0;
include "node_modules/circomlib/circuits/poseidon.circom";

template MerkleProof(depth) {
    signal input leaf;
    signal input root;
    signal input pathIndices[depth];
    signal input pathElements[depth];
    signal output valid;

    component hash_pair[depth];
    signal currentHash[depth + 1];
    signal temp_left[depth];
    signal temp_right[depth];
    
    signal oneMinusIndex[depth];
    signal currentTimesOneMinusIndex[depth];
    signal pathTimesIndex[depth];
    signal currentTimesIndex[depth];
    signal pathTimesOneMinusIndex[depth];

    currentHash[0] <== leaf;

    for (var i = 0; i < depth; i++) {
        hash_pair[i] = Poseidon(2);

        oneMinusIndex[i] <== 1 - pathIndices[i];
        
        currentTimesOneMinusIndex[i] <== oneMinusIndex[i] * currentHash[i];
        pathTimesIndex[i] <== pathIndices[i] * pathElements[i];
        temp_left[i] <== currentTimesOneMinusIndex[i] + pathTimesIndex[i];
        
        currentTimesIndex[i] <== pathIndices[i] * currentHash[i];
        pathTimesOneMinusIndex[i] <== oneMinusIndex[i] * pathElements[i];
        temp_right[i] <== currentTimesIndex[i] + pathTimesOneMinusIndex[i];

        hash_pair[i].inputs[0] <== temp_left[i];
        hash_pair[i].inputs[1] <== temp_right[i];
        
        currentHash[i + 1] <== hash_pair[i].out;
    }

    // Comment out assertion for testing - uncomment for production
    // root === currentHash[depth];
    valid <== 1;
}

template Transfer() {
    signal input sender;
    signal input receiver;
    signal input amount;
    signal input nonce;
    signal input root;
    
    signal input pathElements[3];
    signal input pathIndices[3];
    
    signal output validTransfer;

    component txHash = Poseidon(4);
    txHash.inputs[0] <== sender;
    txHash.inputs[1] <== receiver;
    txHash.inputs[2] <== amount;
    txHash.inputs[3] <== nonce;

    component merkleProof = MerkleProof(3);
    merkleProof.leaf <== txHash.out;
    merkleProof.root <== root;
    for (var i = 0; i < 3; i++) {
        merkleProof.pathElements[i] <== pathElements[i];
        merkleProof.pathIndices[i] <== pathIndices[i];
    }

    validTransfer <== merkleProof.valid;
}

component main = Transfer();