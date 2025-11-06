// scripts/deployContracts.js - Deploy contracts ONCE
import pkg from "hardhat";
import fs from "fs";
const { ethers } = pkg;

async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║   DEPLOYING CONTRACTS (ONE-TIME SETUP)                         ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy ZK Verifier
  const Verifier = await ethers.getContractFactory("ZKBridgeVerifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("✅ ZK Verifier deployed at:", verifierAddress);

  // Deploy L2A
  const L2A = await ethers.getContractFactory("L2A");
  const l2a = await L2A.deploy(verifierAddress);
  await l2a.waitForDeployment();
  const l2aAddress = await l2a.getAddress();
  console.log("✅ L2A deployed at:", l2aAddress);

  // Deploy L2B
  const L2B = await ethers.getContractFactory("L2B");
  const l2b = await L2B.deploy();
  await l2b.waitForDeployment();
  const l2bAddress = await l2b.getAddress();
  console.log("✅ L2B deployed at:", l2bAddress);

  // Save addresses to file
  const addresses = {
    verifier: verifierAddress,
    l2a: l2aAddress,
    l2b: l2bAddress,
    deployer: deployer.address
  };

  fs.writeFileSync("deployed-addresses.json", JSON.stringify(addresses, null, 2));
  console.log("\n✅ Contract addresses saved to deployed-addresses.json");
  
  // Check initial balances
  const balanceA = await l2a.balances(deployer.address);
  console.log("\n💰 Initial Balances:");
  console.log("L2A (Deployer):", balanceA.toString(), "tokens");
  console.log("L2B: 0 tokens");

}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});