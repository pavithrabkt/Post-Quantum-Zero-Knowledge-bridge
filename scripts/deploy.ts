import { ethers } from "hardhat";

async function main() {
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy L2A
  const L2A = await ethers.getContractFactory("L2A");
  const l2a = await L2A.deploy();
  await l2a.deployed();
  console.log("L2A deployed to:", l2a.address);

  // Deploy L2B
  const L2B = await ethers.getContractFactory("L2B");
  const l2b = await L2B.deploy();
  await l2b.deployed();
  console.log("L2B deployed to:", l2b.address);
}

// Run script
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
