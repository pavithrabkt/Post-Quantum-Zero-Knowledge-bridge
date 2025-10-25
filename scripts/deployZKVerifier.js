// scripts/deployZKVerifier.js
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contract with account:", deployer.address);

  const ZKBridgeVerifier = await ethers.getContractFactory("ZKBridgeVerifier");
  const verifier = await ZKBridgeVerifier.deploy();

  await verifier.waitForDeployment(); // new version of deployed()

  console.log("ZKBridgeVerifier deployed to:", await verifier.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
