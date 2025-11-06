// pq-crypto/algo.js
import { MlKem1024 } from "crystals-kyber-js";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

// === Generate ML-KEM (Kyber) key pair ===
export async function generateKeys() {
  const kem = new MlKem1024();
  const [publicKey, privateKey] = await kem.generateKeyPair();
  return { publicKey, privateKey };
}

// === Encapsulate shared secret ===
export async function kemEncapsulate(publicKey) {
  const kem = new MlKem1024();
  const [ciphertext, sharedSecret] = await kem.encap(publicKey);
  return { ciphertext, sharedSecret };
}

// === Decapsulate shared secret ===
export async function kemDecapsulate(privateKey, ciphertext) {
  const kem = new MlKem1024();
  const sharedSecret = await kem.decap(ciphertext, privateKey);
  return sharedSecret;
}

// === AES-GCM Encryption ===
export function encryptAes(sharedSecret, plaintext) {
  const key = Buffer.from(sharedSecret).slice(0, 32); // 256-bit AES key
  const iv = randomBytes(12); // 12-byte nonce
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { ciphertext, iv, authTag };
}

// === AES-GCM Decryption ===
export function decryptAes(sharedSecret, iv, authTag, ciphertext) {
  const key = Buffer.from(sharedSecret).slice(0, 32);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext;
}

// === Demo (optional - can be run standalone) ===
async function main() {
  console.log("=== PQ Bridge Demo: ML-KEM (Kyber1024) + AES-GCM ===");

  // 1. Key generation (Receiver)
  const { publicKey, privateKey } = await generateKeys();
  console.log("Public Key (Base64):", Buffer.from(publicKey).toString("base64").substring(0, 64) + "...");

  // 2. Encapsulation (Sender)
  const { ciphertext: ctKem, sharedSecret: ssSender } = await kemEncapsulate(publicKey);
  console.log("KEM Ciphertext (Base64):", Buffer.from(ctKem).toString("base64").substring(0, 64) + "...");

  // 3. AES-GCM encryption
  const payload = Buffer.from("Confidential Asset Transfer Data", "utf8");
  const { ciphertext, iv, authTag } = encryptAes(ssSender, payload);
  console.log("AES Encrypted Payload (Base64):", ciphertext.toString("base64"));

  // 4. Decapsulation (Receiver)
  const ssReceiver = await kemDecapsulate(privateKey, ctKem);

  // 5. AES-GCM decryption
  const decrypted = decryptAes(ssReceiver, iv, authTag, ciphertext);
  console.log("Decrypted Payload:", decrypted.toString("utf8"));
}

// Only run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}