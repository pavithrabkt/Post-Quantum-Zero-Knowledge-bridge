use aes_gcm::{Aes256Gcm, Key, Nonce}; // AES-GCM with 256-bit key
use aes_gcm::aead::{Aead, KeyInit};
use rand::RngCore;
use sha3::{Sha3_256, Digest};
use generic_array::GenericArray;

pub struct EncryptedPayload {
    pub ciphertext: Vec<u8>,
    pub nonce: Vec<u8>,
    pub encrypted_payload: Vec<u8>,
}

pub fn generate_keys() -> ([u8; 32], [u8; 32]) {
    // Simulate keypair with random bytes
    let mut pk = [0u8; 32];
    let mut sk = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut pk);
    rand::thread_rng().fill_bytes(&mut sk);
    (pk, sk)
}

pub fn create_payload(message: &str) -> String {
    let mut hasher = Sha3_256::new();
    hasher.update(message.as_bytes());
    let hash = hasher.finalize();
    hex::encode(hash)
}

pub fn encrypt_payload(payload: &str, receiver_pk: &[u8; 32]) -> EncryptedPayload {
    let key = Key::<Aes256Gcm>::from_slice(receiver_pk);
    let cipher = Aes256Gcm::new(key);

    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher.encrypt(nonce, payload.as_bytes()).expect("encryption failed");

    EncryptedPayload {
        ciphertext: ciphertext.clone(),
        nonce: nonce_bytes.to_vec(),
        encrypted_payload: ciphertext,
    }
}

pub fn decrypt_payload(
    encrypted_payload: &[u8],
    nonce: &[u8],
    _ciphertext: &[u8],
    sk: &[u8; 32],
) -> String {
    let key = Key::<Aes256Gcm>::from_slice(sk);
    let cipher = Aes256Gcm::new(key);

    let nonce = Nonce::from_slice(nonce);
    let decrypted = cipher.decrypt(nonce, encrypted_payload).expect("decryption failed");
    String::from_utf8(decrypted).expect("invalid UTF-8")
}

pub fn verify_integrity(decrypted: &str, original_len: usize) -> bool {
    decrypted.len() > 0 && decrypted.len() >= original_len
}
