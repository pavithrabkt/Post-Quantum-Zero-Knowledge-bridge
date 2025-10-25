// build_input_poseidon.js
// usage: node scripts/build_input_poseidon.js <sender> <receiver> <amount> <nonce> <leafIndex>
// Example: node scripts/build_input_poseidon.js 1 2 1000 42 0

import fs from "fs";
import { buildPoseidon } from "circomlibjs";

function toBigInt(s) {
  if (typeof s === "bigint") return s;
  if (s.startsWith("0x")) return BigInt(s);
  return BigInt(s);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 5) {
    console.log("Usage: node build_input_poseidon.js <sender> <receiver> <amount> <nonce> <leafIndex>");
    process.exit(1);
  }

  const [senderRaw, receiverRaw, amountRaw, nonceRaw, leafIndexRaw] = args;
  const sender = toBigInt(senderRaw);
  const receiver = toBigInt(receiverRaw);
  const amount = toBigInt(amountRaw);
  const nonce = toBigInt(nonceRaw);
  const leafIndex = parseInt(leafIndexRaw);

  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  // compute leaf = Poseidon([sender, receiver, amount, nonce])
  const leaf = poseidon([sender, receiver, amount, nonce]);
  const leafStr = F.toString(leaf);

  // build a simple depth-3 Merkle tree (8 leaves)
  const depth = 3;
  const size = 1 << depth;
  const leaves = new Array(size);

  for (let i = 0; i < size; i++) {
    if (i === leafIndex) {
      leaves[i] = BigInt(leafStr);
    } else {
      // filler (deterministic non-zero values) to avoid equal leaves
      const filler = poseidon([BigInt(0), BigInt(i + 1)]);
      leaves[i] = BigInt(F.toString(filler));
    }
  }

  // compute pathElements & pathIndices for leafIndex
  let level = leaves.slice();
  const pathElements = [];
  const pathIndices = [];
  let idx = leafIndex;

  for (let d = 0; d < depth; d++) {
    const siblingIndex = idx ^ 1;
    pathElements.push(level[siblingIndex].toString());
    pathIndices.push((idx % 2).toString());

    // compute next level
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1];
      const h = poseidon([left, right]);
      next.push(BigInt(F.toString(h)));
    }
    level = next;
    idx = Math.floor(idx / 2);
  }

  const root = level[0].toString();

  const input = {
    sender: sender.toString(),
    receiver: receiver.toString(),
    amount: amount.toString(),
    nonce: nonce.toString(),
    root: root,
    pathElements: pathElements,
    pathIndices: pathIndices
  };

  fs.writeFileSync("input.json", JSON.stringify(input, null, 2));
  console.log("Wrote input.json\n", JSON.stringify(input, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
