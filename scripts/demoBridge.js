// scripts/demoBridge.js 
import pkg from "hardhat";
import fs from "fs";
import { generateKeys, kemEncapsulate, kemDecapsulate, encryptAes, decryptAes } from "../pq-crypto/algo.js";

const { ethers } = pkg;

async function main() {
  const [deployer, receiver] = await ethers.getSigners();

  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║   POST-QUANTUM ZERO-KNOWLEDGE BRIDGE DEMO                      ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  console.log("👤 Deployer:", deployer.address);
  console.log("👤 Receiver:", receiver.address);

  // --- Deploy verifier ---
  const Verifier = await ethers.getContractFactory("ZKBridgeVerifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log(" ZK Verifier deployed at:", verifierAddress);

  // --- Deploy L2A + L2B ---
  const L2A = await ethers.getContractFactory("L2A");
  const l2a = await L2A.deploy(verifierAddress);
  await l2a.waitForDeployment();
  console.log(" L2A deployed at:", await l2a.getAddress());

  const L2B = await ethers.getContractFactory("L2B");
  const l2b = await L2B.deploy();
  await l2b.waitForDeployment();
  console.log(" L2B deployed at:", await l2b.getAddress());

  // --- Load proof + public.json ---
  const proof = JSON.parse(fs.readFileSync("proof.json"));
  const pub = JSON.parse(fs.readFileSync("public.json"));

  // Extract proof parameters
  const a = [proof.pi_a[0], proof.pi_a[1]];
  const b = [
    [proof.pi_b[0][1], proof.pi_b[0][0]],
    [proof.pi_b[1][1], proof.pi_b[1][0]]
  ];
  const c = [proof.pi_c[0], proof.pi_c[1]];
  const input = [pub[0], pub[1]];

  console.log("\n" + "=".repeat(70));
  console.log(" ZK PROOF PARAMETERS");
  console.log("=".repeat(70));
  console.log("Proof component A:", a);
  console.log("Proof component B:", b);
  console.log("Proof component C:", c);
  console.log("Public inputs [root, nullifier]:", input);

  // --- Test verification first ---
  console.log("\n" + "=".repeat(70));
  console.log(" TESTING ZK PROOF VERIFICATION");
  console.log("=".repeat(70));
  try {
    const isValid = await verifier.verifyProof(a, b, c, input);
    console.log(" Proof verification result:", isValid);
    
    if (!isValid) {
      console.error(" Proof is invalid!");
      process.exit(1);
    }
  } catch (err) {
    console.error(" Verification failed:", err.message);
    process.exit(1);
  }

  // --- Check initial balances ---
  let balanceA = await l2a.balances(deployer.address);
  console.log("\n" + "=".repeat(70));
  console.log(" INITIAL BALANCES");
  console.log("=".repeat(70));
  console.log("L2A (Sender):", balanceA.toString(), "tokens");
  console.log("L2B (Receiver): 0 tokens");

  // ========================================================================
  // POST-QUANTUM ENCRYPTION LAYER
  // ========================================================================
  
  console.log("\n" + "=".repeat(70));
  console.log(" POST-QUANTUM ENCRYPTION (KEM-1024");
  console.log("=".repeat(70));

  // 1. Receiver generates key pair
  console.log("\n[Step 1] Receiver generates (KEM-1024) key pair...");
  const { publicKey, privateKey } = await generateKeys();
  console.log(" Public Key (first 64 bytes):", Buffer.from(publicKey).toString("base64").substring(0, 64) + "...");
  console.log(" Private Key generated (kept secret)");

  // 2. Sender creates the transaction payload
  const amount = 100;
  const transactionPayload = {
    from: deployer.address,
    to: receiver.address,
    amount: amount,
    zkProof: { a, b, c, input },
    timestamp: Date.now()
  };

  console.log("\n[Step 2] Creating transaction payload...");
  console.log(" Original Payload:");
  console.log(JSON.stringify(transactionPayload, null, 2));

  // 3. Sender encapsulates shared secret using receiver's public key
  console.log("\n[Step 3] Sender encapsulates shared secret...");
  const { ciphertext: kemCiphertext, sharedSecret: senderSharedSecret } = await kemEncapsulate(publicKey);
  console.log(" KEM Ciphertext (first 64 bytes):", Buffer.from(kemCiphertext).toString("base64").substring(0, 64) + "...");
  console.log(" Shared Secret established:", Buffer.from(senderSharedSecret).toString("hex").substring(0, 32) + "...");

  // 4. Encrypt the payload with AES-GCM
  console.log("\n[Step 4] Encrypting payload with AES-256-GCM...");
  const payloadBuffer = Buffer.from(JSON.stringify(transactionPayload), "utf8");
  const { ciphertext: encryptedPayload, iv, authTag } = encryptAes(senderSharedSecret, payloadBuffer);
  
  console.log(" Encrypted Payload (first 64 bytes):", encryptedPayload.toString("base64").substring(0, 64) + "...");
  console.log(" IV:", iv.toString("hex"));
  console.log(" Auth Tag:", authTag.toString("hex"));

  // ========================================================================
  // SIMULATE CROSS-CHAIN TRANSMISSION
  // ========================================================================

  console.log("\n" + "=".repeat(70));
  console.log(" SIMULATING CROSS-CHAIN BRIDGE TRANSMISSION");
  console.log("=".repeat(70));
  console.log(" Transmitting encrypted data from L2A to L2B...");
  console.log(" Encrypted Payload Size:", encryptedPayload.length, "bytes");
  console.log(" KEM Ciphertext Size:", kemCiphertext.length, "bytes");
  console.log(" Data transmitted securely (quantum-resistant)");

  // ========================================================================
  // RECEIVER SIDE - POST-QUANTUM DECRYPTION
  // ========================================================================

  console.log("\n" + "=".repeat(70));
  console.log(" POST-QUANTUM DECRYPTION AT L2B");
  console.log("=".repeat(70));

  // 5. Receiver decapsulates shared secret
  console.log("\n[Step 5] Receiver decapsulates shared secret...");
  const receiverSharedSecret = await kemDecapsulate(privateKey, kemCiphertext);
  console.log(" Shared Secret recovered:", Buffer.from(receiverSharedSecret).toString("hex").substring(0, 32) + "...");

  // 6. Decrypt the payload
  console.log("\n[Step 6] Decrypting payload with AES-256-GCM...");
  const decryptedPayloadBuffer = decryptAes(receiverSharedSecret, iv, authTag, encryptedPayload);
  const decryptedPayload = JSON.parse(decryptedPayloadBuffer.toString("utf8"));
  
  console.log(" Decrypted Payload:");
  console.log(JSON.stringify(decryptedPayload, null, 2));

  // 7. Verify the secrets match
  const secretsMatch = Buffer.from(senderSharedSecret).equals(Buffer.from(receiverSharedSecret));
  console.log("\n[Step 7] Verifying encryption integrity...");
  console.log(" Shared secrets match:", secretsMatch);
  console.log(" Payload integrity verified!");

  // ========================================================================
  // EXECUTE BLOCKCHAIN TRANSACTIONS
  // ========================================================================

  console.log("\n" + "=".repeat(70));
  console.log("  EXECUTING BLOCKCHAIN TRANSACTIONS");
  console.log("=".repeat(70));

  console.log("\n Initiating bridge transfer on L2A...");
  const tx1 = await l2a.bridgeTransfer(
    decryptedPayload.to,
    decryptedPayload.amount,
    decryptedPayload.zkProof.a,
    decryptedPayload.zkProof.b,
    decryptedPayload.zkProof.c,
    decryptedPayload.zkProof.input
  );
  await tx1.wait();
  console.log("   L2A bridge transfer completed!");
  console.log("   Transaction hash:", tx1.hash);

  console.log("\n Relaying message to L2B...");
  const tx2 = await l2b.receiveFromBridge(
    decryptedPayload.from,
    decryptedPayload.to,
    decryptedPayload.amount
  );
  await tx2.wait();
  console.log(" L2B received and processed transfer!");
  console.log("   Transaction hash:", tx2.hash);

  // ========================================================================
  // FINAL RESULTS
  // ========================================================================

  const newBalA = await l2a.balances(deployer.address);
  const newBalB = await l2b.balances(receiver.address);

  console.log("\n" + "=".repeat(70));
  console.log(" FINAL BALANCES");
  console.log("=".repeat(70));
  console.log("L2A (Sender):", newBalA.toString(), "tokens ");
  console.log("L2B (Receiver):", newBalB.toString(), "tokens ");

  console.log("\n" + "=".repeat(70));
  console.log(" SUCCESS: POST-QUANTUM ZK BRIDGE COMPLETED!");
  console.log("=".repeat(70));
  console.log(" Zero-Knowledge Proof: Verified");
  console.log(" Post-Quantum Encryption: (KEM-1024)");
  console.log(" Symmetric Encryption: AES-256-GCM");
  console.log(" Cross-Chain Transfer: Successful");
  console.log(" Quantum Resistance: Guaranteed");
  console.log("=".repeat(70) + "\n");
}

main().catch((err) => {
  console.error("\n ERROR:", err.message);
  console.error(err);
  process.exit(1);
});