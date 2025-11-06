// scripts/verifyProof.js
import fs from "fs";
import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  // ✅ Read proof + public signals
  const proof = JSON.parse(fs.readFileSync("proof.json"));
  const pub = JSON.parse(fs.readFileSync("public.json"));

  // ✅ Ensure we have exactly 2 public inputs
  if (pub.length !== 2) {
    console.error(`❌ Expected 2 public signals [root, nullifier], but got ${pub.length}`);
    console.error("   Public inputs:", pub);
    process.exit(1);
  }

  // ✅ Deployed verifier address
  const verifierAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const verifier = await ethers.getContractAt("ZKBridgeVerifier", verifierAddress);

  const a = [proof.pi_a[0], proof.pi_a[1]];
  
  const b = [
    [proof.pi_b[0][1], proof.pi_b[0][0]], 
    [proof.pi_b[1][1], proof.pi_b[1][0]]
  ];
  
  const c = [proof.pi_c[0], proof.pi_c[1]];
  const input = [pub[0], pub[1]];

  console.log("🔍 Verifying proof on-chain...");
  console.log("Verifier address:", verifierAddress);
  console.log("Public inputs:", input);

  try {
    const tx = await verifier.verifyProofOnChain(a, b, c, input);
    await tx.wait();
    
    console.log("✅ Proof verified successfully!");
    console.log("Transaction hash:", tx.hash);
  } catch (err) {
    console.error("❌ Verification failed:", err.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});