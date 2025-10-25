const { buildPoseidon } = require("circomlibjs");

async function verifyInput() {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;
    
    // Your input values
    const sender = BigInt("1");
    const receiver = BigInt("2");
    const amount = BigInt("1000");
    const nonce = BigInt("42");
    
    const providedRoot = BigInt("19317508248453107378816124879274506332996989867318818865263382184452793129036");
    
    const pathElements = [BigInt("0"), BigInt("0"), BigInt("0")];
    const pathIndices = [0, 0, 0];
    
    console.log("=== INPUT VERIFICATION ===\n");
    console.log("Transaction Details:");
    console.log("  Sender:", sender.toString());
    console.log("  Receiver:", receiver.toString());
    console.log("  Amount:", amount.toString());
    console.log("  Nonce:", nonce.toString());
    console.log();
    
    // Step 1: Compute transaction hash (leaf)
    const txHash = poseidon([sender, receiver, amount, nonce]);
    const txHashStr = F.toString(txHash);
    
    console.log("Step 1 - Transaction Hash (Leaf):");
    console.log("  Hash:", txHashStr);
    console.log();
    
    // Step 2: Compute Merkle root from leaf and path
    let currentHash = BigInt(txHashStr);
    console.log("Step 2 - Merkle Path Computation:");
    console.log("  Level 0 (Leaf):", currentHash.toString());
    
    for (let i = 0; i < pathElements.length; i++) {
        const sibling = pathElements[i];
        const index = pathIndices[i];
        
        let left, right;
        if (index === 0) {
            // Current is left child
            left = currentHash;
            right = sibling;
        } else {
            // Current is right child
            left = sibling;
            right = currentHash;
        }
        
        const hash = poseidon([left, right]);
        currentHash = BigInt(F.toString(hash));
        
        console.log(`  Level ${i + 1}: hash(${left.toString()}, ${right.toString()})`);
        console.log(`           = ${currentHash.toString()}`);
    }
    
    const computedRoot = currentHash;
    
    console.log();
    console.log("Step 3 - Root Comparison:");
    console.log("  Provided Root: ", providedRoot.toString());
    console.log("  Computed Root: ", computedRoot.toString());
    console.log();
    
    if (providedRoot === computedRoot) {
        console.log("✅ SUCCESS! Root matches. Your input.json is CORRECT.");
        console.log("\nYou can now generate the witness:");
        console.log("  node build/transfer_js/generate_witness.js build/transfer_js/transfer.wasm input.json witness.wtns");
    } else {
        console.log("❌ ERROR! Root mismatch.");
        console.log("\nThe correct input.json should be:");
        
        const correctInput = {
            sender: sender.toString(),
            receiver: receiver.toString(),
            amount: amount.toString(),
            nonce: nonce.toString(),
            root: computedRoot.toString(),
            pathElements: pathElements.map(e => e.toString()),
            pathIndices: pathIndices
        };
        
        console.log(JSON.stringify(correctInput, null, 2));
    }
    
    // Also compute the nullifier for reference
    const nullifierHash = poseidon([txHash, nonce]);
    const nullifier = F.toString(nullifierHash);
    console.log("\nExpected Nullifier (for verification):");
    console.log("  ", nullifier);
}

verifyInput().catch(console.error);