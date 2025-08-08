use std::fs;
use serde::{Deserialize};
use serde_json::json;

mod crypto_utils;
use crypto_utils::*;

use std::thread;
use std::time::Duration;

#[derive(Deserialize)]
struct ProofInput {
    pi_a: Vec<String>,
    pi_b: Vec<Vec<String>>,
    pi_c: Vec<String>,
    protocol: String,
    curve: String,
}

fn flatten_json(input: &ProofInput) -> String {
    let mut flat = vec![];

    // Flatten pi_a
    flat.extend(input.pi_a.clone());

    // Flatten pi_b (2D array)
    for pair in &input.pi_b {
        flat.extend(pair.clone());
    }

    // Flatten pi_c
    flat.extend(input.pi_c.clone());

    // Create structured JSON
    let flattened = json!({
        "protocol": input.protocol,
        "curve": input.curve,
        "proof": flat
    });

    serde_json::to_string_pretty(&flattened).unwrap()
}

fn main() -> anyhow::Result<()> {
    // 🔍 Read input from JSON
    let json_str = fs::read_to_string("proof.json")?;
    let input: ProofInput = serde_json::from_str(&json_str)?;

    // 🧾 Flatten and serialize
    let message = flatten_json(&input);
    println!("📨 Flattened Message:\n{}\n", message);

    // 🧩 Create payload
    let summapayload = create_payload(&message);
    
    let payload= format!("{}{}", message, summapayload);
    println!("Payload (Data+Sign) : {}\n\n", payload);
    

    // 🔐 Generate keys
    let (pk, _) = generate_keys();

    // 🔒 Encrypt
    println!("Waiting for Receiver's Public key . . . .");
    thread::sleep(Duration::from_secs(1));
    let encrypted = encrypt_payload(&payload, &pk);
    println!("---------Received Public key ! ! !---------");
    println!("\n\nCreating the shared_secret . . . . ");
    thread::sleep(Duration::from_secs(1));
    
    println!("🧊 Ciphertext: {}\n", hex::encode(&encrypted.ciphertext));
    thread::sleep(Duration::from_secs(1));
    println!("🔑 Nonce: {}\n", hex::encode(&encrypted.nonce));
    thread::sleep(Duration::from_secs(1));
    println!("🔐 Encrypted Payload: {}\n", hex::encode(&encrypted.encrypted_payload));
    
    println!("\n\n\nTRANSMITTING THE MESSAGE . . . . . . . . . . . . ");
    thread::sleep(Duration::from_secs(3));
    // 🔓 Decrypt
    println!("Received the Payload!\nSynthesizing the shared_secret by employing the receiver's private key . . . . .");
    thread::sleep(Duration::from_secs(1));
    println!("Shared_Secret Computed ! ! !.\nDecrypting. . . . . . . . \n");
    thread::sleep(Duration::from_secs(1));
    let decrypted = decrypt_payload(
        &encrypted.encrypted_payload,
        &encrypted.nonce,
        &encrypted.ciphertext,
        &pk,
    );
    println!("🧾 Decrypted Payload:\n{}\n", decrypted);
    println!("Initiating the Integrity check  . . . . . ");
    thread::sleep(Duration::from_secs(2));
    // ✅ Verify integrity
    let integrity_ok = verify_integrity(&decrypted, message.len());
    println!("✅ Integrity Check Passed: {}\n", integrity_ok);

    Ok(())
}

