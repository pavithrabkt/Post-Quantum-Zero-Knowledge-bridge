import json

def restructure_flattened_proof(input_file='output.json', output_file='output.json'):
    with open(input_file, 'r') as f:
        data = json.load(f)

    flat_proof = data.get("proof", [])
    if len(flat_proof) != 12:
        print("❌ Invalid proof length. Expected 12 elements.")
        return

    # Reconstruct from flattened proof
    pi_a = flat_proof[0:3]
    pi_b = [
        flat_proof[3:5],
        flat_proof[5:7],
        flat_proof[7:9]
    ]
    pi_c = flat_proof[9:12]

    structured = {
        "pi_a": pi_a,
        "pi_b": pi_b,
        "pi_c": pi_c,
        "protocol": data.get("protocol", ""),
        "curve": data.get("curve", "")
    }

    with open(output_file, 'w') as f:
        json.dump(structured, f, indent=2)

    print("✅ Restructured proof written to", output_file)

if __name__ == "__main__":
    restructure_flattened_proof()
