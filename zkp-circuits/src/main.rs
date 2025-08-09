use std::fs;
use serde::{Deserialize};
use serde_json::{json, Value, Map};

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

    flat.extend(input.pi_a.clone());

    for pair in &input.pi_b {
        flat.extend(pair.clone());
    }

    flat.extend(input.pi_c.clone());

    let flattened = json!({
        "proof": flat,
        "protocol": input.protocol,
        "curve": input.curve
    });

    serde_json::to_string_pretty(&flattened).unwrap()
}

fn main() -> anyhow::Result<()> {
    let json_str = fs::read_to_string("proof.json")?;
    let input: ProofInput = serde_json::from_str(&json_str)?;

    let pi_a_len = input.pi_a.len();
    let pi_b_len = input.pi_b.len();
    let pi_b_pair_len = if pi_b_len > 0 { input.pi_b[0].len() } else { 0 };
    let pi_c_len = input.pi_c.len();

    let message = flatten_json(&input);
    println!("📨 Flattened Message:\n{}\n", message);

    let summapayload = create_payload(&message);
    let payload = format!("{}{}", message, summapayload);
    println!("Payload (Data+Sign) : {}\n\n", payload);

    let (pk, _) = generate_keys();

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

    let integrity_ok = verify_integrity(&decrypted, message.len());
    println!("✅ Integrity Check Passed: {}\n", integrity_ok);


    // Write the decrypted JSON part directly to received.json
    let (json_part, _signature_part) = decrypted.split_at(message.len());
    fs::write("received.json", json_part)?;
    println!("📁 Output successfully written to received.json\n");

    // Optionally, pretty-print the received.json for readability
    let raw = fs::read_to_string("received.json")?;
    let parsed: Value = serde_json::from_str(&raw)?;
    fs::write("received.json", serde_json::to_string_pretty(&parsed)?)?;
    println!("✅ Final received.json pretty-printed and ready for snarkjs\n");

    Ok(())
}
