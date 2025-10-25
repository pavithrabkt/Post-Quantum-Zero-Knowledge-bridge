// compute_nullifier.cjs
const circomlibjs = require("circomlibjs");

async function main() {
  const poseidon = await circomlibjs.buildPoseidon();

  const sender = 1n;
  const receiver = 2n;
  const amount = 1000n;
  const nonce = 42n;

  // Step 1: txHash = Poseidon(sender, receiver, amount, nonce)
  const txHash = poseidon([sender, receiver, amount, nonce]);

  // Step 2: nullifier = Poseidon(txHash, nonce)
  const nullifier = poseidon([txHash, nonce]);

  console.log("txHash:", poseidon.F.toString(txHash));
  console.log("nullifier:", poseidon.F.toString(nullifier));
}

main();
