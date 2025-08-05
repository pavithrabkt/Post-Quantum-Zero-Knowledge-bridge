pragma circom 2.0.0;
include "node_modules/circomlib/circuits/poseidon.circom";

template SimpleHashTest() {
    // Public inputs
    signal input sender;
    signal input receiver;
    signal input amount;
    signal input nonce;
    
    signal output txHash;

    // Create a hash of the transaction data
    component hashComp = Poseidon(4);
    hashComp.inputs[0] <== sender;
    hashComp.inputs[1] <== receiver;
    hashComp.inputs[2] <== amount;
    hashComp.inputs[3] <== nonce;

    txHash <== hashComp.out;
}

// Main component
component main = SimpleHashTest();