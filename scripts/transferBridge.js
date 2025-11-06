// scripts/transferBridge.js
import pkg from "hardhat";
import fs from "fs";
import { generateKeys, kemEncapsulate, kemDecapsulate, encryptAes, decryptAes } from "../pq-crypto/algo.js";

const { ethers } = pkg;

async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║   POST-QUANTUM ZERO-KNOWLEDGE BRIDGE TRANSFER                  ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // ========================================================================
  // LOAD DEPLOYED CONTRACT ADDRESSES
  // ========================================================================
  
  if (!fs.existsSync("deployed-addresses.json")) {
    console.error("❌ Error: deployed-addresses.json not found!");
    console.error("   Please run: npx hardhat run scripts/deployContracts.js --network localhost");
    process.exit(1);
  }

  const addresses = JSON.parse(fs.readFileSync("deployed-addresses.json"));
  console.log("📄 Using deployed contracts:");
  console.log("   Verifier:", addresses.verifier);
  console.log("   L2A:", addresses.l2a);
  console.log("   L2B:", addresses.l2b);

  const [deployer, receiver] = await ethers.getSigners();
  console.log("\n👤 Sender:", deployer.address);
  console.log("👤 Receiver:", receiver.address);

  // Connect to existing deployed contracts
  const verifier = await ethers.getContractAt("ZKBridgeVerifier", addresses.verifier);
  const l2a = await ethers.getContractAt("L2A", addresses.l2a);
  const l2b = await ethers.getContractAt("L2B", addresses.l2b);

  // ========================================================================
  // LOAD ZK PROOF
  // ========================================================================
  
  const proof = JSON.parse(fs.readFileSync("proof.json"));
  const pub = JSON.parse(fs.readFileSync("public.json"));

  const a = [proof.pi_a[0], proof.pi_a[1]];
  const b = [
    [proof.pi_b[0][1], proof.pi_b[0][0]],
    [proof.pi_b[1][1], proof.pi_b[1][0]]
  ];
  const c = [proof.pi_c[0], proof.pi_c[1]];
  const input = [pub[0], pub[1]];

  console.log("\n" + "=".repeat(70));
  console.log("📊 ZK PROOF PARAMETERS");
  console.log("=".repeat(70));
  console.log("Proof component A:", a);
  console.log("Proof component B:", b);
  console.log("Proof component C:", c);
  console.log("Public inputs [root, nullifier]:", input);

  // ========================================================================
  // CHECK BALANCES BEFORE TRANSFER
  // ========================================================================
  
  const balanceASender = await l2a.balances(deployer.address);
  const balanceBReceiver = await l2b.balances(receiver.address);
  
  console.log("\n" + "=".repeat(70));
  console.log("💰 BALANCES BEFORE TRANSFER");
  console.log("=".repeat(70));
  console.log("L2A (Sender):", balanceASender.toString(), "tokens");
  console.log("L2B (Receiver):", balanceBReceiver.toString(), "tokens");

  // ========================================================================
  // POST-QUANTUM ENCRYPTION LAYER
  // ========================================================================
  
  console.log("\n" + "=".repeat(70));
  console.log("🔐 POST-QUANTUM ENCRYPTION (ML-KEM-1024)");
  console.log("=".repeat(70));

  console.log("\n[Step 1] Receiver generates ML-KEM key pair...");
  const { publicKey, privateKey } = await generateKeys();
  console.log("✅ Public Key (first 64 bytes):", Buffer.from(publicKey).toString("base64").substring(0, 64) + "...");
  console.log("✅ Private Key generated (kept secret)");

  const amount = 100;
  const transactionPayload = {
    from: deployer.address,
    to: receiver.address,
    amount: amount,
    zkProof: { a, b, c, input },
    timestamp: Date.now()
  };

  console.log("\n[Step 2] Creating transaction payload...");
  console.log("📦 Transaction Details:");
  console.log("   From:", transactionPayload.from);
  console.log("   To:", transactionPayload.to);
  console.log("   Amount:", transactionPayload.amount, "tokens");

  console.log("\n[Step 3] Sender encapsulates shared secret...");
  const { ciphertext: kemCiphertext, sharedSecret: senderSharedSecret } = await kemEncapsulate(publicKey);
  console.log("✅ KEM Ciphertext (first 64 bytes):", Buffer.from(kemCiphertext).toString("base64").substring(0, 64) + "...");
  console.log("✅ Shared Secret established:", Buffer.from(senderSharedSecret).toString("hex").substring(0, 32) + "...");

  console.log("\n[Step 4] Encrypting payload with AES-256-GCM...");
  const payloadBuffer = Buffer.from(JSON.stringify(transactionPayload), "utf8");
  const { ciphertext: encryptedPayload, iv, authTag } = encryptAes(senderSharedSecret, payloadBuffer);
  
  console.log("✅ Original Payload Size:", payloadBuffer.length, "bytes");
  console.log("✅ Encrypted Payload (first 64 bytes):", encryptedPayload.toString("base64").substring(0, 64) + "...");
  console.log("✅ IV:", iv.toString("hex"));
  console.log("✅ Auth Tag:", authTag.toString("hex"));

  // ========================================================================
  // CROSS-CHAIN TRANSMISSION
  // ========================================================================

  console.log("\n" + "=".repeat(70));
  console.log("🌉 CROSS-CHAIN TRANSMISSION");
  console.log("=".repeat(70));
  console.log("📡 Transmitting encrypted data from L2A to L2B...");
  console.log("   Encrypted Payload: ✅", encryptedPayload.length, "bytes");
  console.log("   KEM Ciphertext: ✅", kemCiphertext.length, "bytes");
  console.log("   Total transmission size:", (encryptedPayload.length + kemCiphertext.length), "bytes");

  // ========================================================================
  // RECEIVER SIDE DECRYPTION
  // ========================================================================

  console.log("\n" + "=".repeat(70));
  console.log("🔓 POST-QUANTUM DECRYPTION AT L2B");
  console.log("=".repeat(70));

  console.log("\n[Step 5] Receiver decapsulates shared secret...");
  const receiverSharedSecret = await kemDecapsulate(privateKey, kemCiphertext);
  console.log("✅ Shared Secret recovered:", Buffer.from(receiverSharedSecret).toString("hex").substring(0, 32) + "...");

  console.log("\n[Step 6] Decrypting payload with AES-256-GCM...");
  const decryptedPayloadBuffer = decryptAes(receiverSharedSecret, iv, authTag, encryptedPayload);
  const decryptedPayload = JSON.parse(decryptedPayloadBuffer.toString("utf8"));
  
  console.log("✅ Decrypted Transaction:");
  console.log("   From:", decryptedPayload.from);
  console.log("   To:", decryptedPayload.to);
  console.log("   Amount:", decryptedPayload.amount, "tokens");

  const secretsMatch = Buffer.from(senderSharedSecret).equals(Buffer.from(receiverSharedSecret));
  console.log("\n[Step 7] Verifying encryption integrity...");
  console.log("✅ Shared secrets match:", secretsMatch);
  console.log("✅ Payload authenticated and integrity verified!");

  // ========================================================================
  // EXECUTE BLOCKCHAIN TRANSACTIONS
  // ========================================================================

  console.log("\n" + "=".repeat(70));
  console.log("⛓️  EXECUTING BLOCKCHAIN TRANSACTIONS");
  console.log("=".repeat(70));

  console.log("\n🚀 Initiating bridge transfer on L2A...");
  const tx1 = await l2a.bridgeTransfer(
    decryptedPayload.to,
    decryptedPayload.amount,
    decryptedPayload.zkProof.a,
    decryptedPayload.zkProof.b,
    decryptedPayload.zkProof.c,
    decryptedPayload.zkProof.input
  );
  await tx1.wait();
  console.log("✅ L2A transfer completed!");
  console.log("   Transaction hash:", tx1.hash);

  console.log("\n🌉 Relaying to L2B...");
  const tx2 = await l2b.receiveFromBridge(
    decryptedPayload.from,
    decryptedPayload.to,
    decryptedPayload.amount
  );
  await tx2.wait();
  console.log("✅ L2B received transfer!");
  console.log("   Transaction hash:", tx2.hash);

  // ========================================================================
  // FINAL BALANCES
  // ========================================================================

  const newBalA = await l2a.balances(deployer.address);
  const newBalB = await l2b.balances(receiver.address);

  console.log("\n" + "=".repeat(70));
  console.log("💰 BALANCES AFTER TRANSFER");
  console.log("=".repeat(70));
  console.log("L2A (Sender):", newBalA.toString(), "tokens", `(${balanceASender - newBalA} transferred)`);
  console.log("L2B (Receiver):", newBalB.toString(), "tokens", `(+${newBalB - balanceBReceiver} received)`);

  console.log("\n" + "=".repeat(70));
  console.log("🎉 TRANSFER COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(70));
  console.log("✅ Zero-Knowledge Proof: Verified");
  console.log("✅ Post-Quantum Encryption: ML-KEM-1024");
  console.log("✅ Symmetric Encryption: AES-256-GCM");
  console.log("✅ Quantum-Resistant: YES");
  console.log("=".repeat(70) + "\n");
}

main().catch((err) => {
  console.error("\n❌ ERROR:", err.message);
  console.error(err);
  process.exit(1);
});