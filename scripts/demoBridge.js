// scripts/demoBridge.js - FIXED VERSION
import pkg from "hardhat";
import fs from "fs";
const { ethers } = pkg;

async function main() {
  const [deployer, receiver] = await ethers.getSigners();

  console.log("Deployer:", deployer.address);
  console.log("Receiver:", receiver.address);

  // --- Deploy verifier ---
  const Verifier = await ethers.getContractFactory("ZKBridgeVerifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("✅ ZK Verifier deployed at:", verifierAddress);

  // --- Deploy L2A + L2B ---
  const L2A = await ethers.getContractFactory("L2A");
  const l2a = await L2A.deploy(verifierAddress);
  await l2a.waitForDeployment();
  console.log("✅ L2A deployed at:", await l2a.getAddress());

  const L2B = await ethers.getContractFactory("L2B");
  const l2b = await L2B.deploy();
  await l2b.waitForDeployment();
  console.log("✅ L2B deployed at:", await l2b.getAddress());

  // --- Load proof + public.json ---
  const proof = JSON.parse(fs.readFileSync("proof.json"));
  const pub = JSON.parse(fs.readFileSync("public.json"));

  // ✅ FIX: Extract only first 2 coordinates (remove homogeneous coordinate "1")
  const a = [proof.pi_a[0], proof.pi_a[1]];
  
  // ✅ FIX: pi_b needs special handling - swap inner elements and take only first 2
  const b = [
    [proof.pi_b[0][1], proof.pi_b[0][0]], // Swap for Solidity format
    [proof.pi_b[1][1], proof.pi_b[1][0]]  // Swap for Solidity format
  ];
  
  const c = [proof.pi_c[0], proof.pi_c[1]];
  
  // ✅ FIX: Ensure we use exactly 2 public inputs
  const input = [pub[0], pub[1]];

  console.log("\n🔍 Proof Parameters:");
  console.log("a:", a);
  console.log("b:", b);
  console.log("c:", c);
  console.log("input:", input);

  // --- Test verification first ---
  console.log("\n🧪 Testing proof verification...");
  try {
    const isValid = await verifier.verifyProof(a, b, c, input);
    console.log("✅ Proof verification:", isValid);
    
    if (!isValid) {
      console.error("❌ Proof is invalid!");
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Verification failed:", err.message);
    process.exit(1);
  }

  // --- Check initial balances ---
  let balanceA = await l2a.balances(deployer.address);
  console.log("\n💰 Initial Balances:");
  console.log("L2A (Sender):", balanceA.toString());
  console.log("L2B (Receiver): 0");

  // --- Simulate cross-chain bridge ---
  const amount = 100;
  console.log("\n🚀 Initiating bridge transfer...");
  
  const tx1 = await l2a.bridgeTransfer(receiver.address, amount, a, b, c, input);
  await tx1.wait();
  console.log("✅ Bridge transfer successful!");

  // Simulate L2 relay
  console.log("🌉 Relaying message to L2B...");
  const tx2 = await l2b.receiveFromBridge(deployer.address, receiver.address, amount);
  await tx2.wait();

  // --- Final Balances ---
  const newBalA = await l2a.balances(deployer.address);
  const newBalB = await l2b.balances(receiver.address);

  console.log("\n✅ Final Balances:");
  console.log("L2A (Sender):", newBalA.toString());
  console.log("L2B (Receiver):", newBalB.toString());

  console.log("\n🎉 ZKBridge simulation completed successfully!");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});