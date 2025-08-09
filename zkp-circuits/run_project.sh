# Clone circom if not already cloned
if [ ! -d "circom" ]; then
    git clone "https://github.com/iden3/circom.git"
    echo "Circom cloned from the global GitHub repo :)"
else
    echo "Circom directory already exists. Skipping clone."
fi

clear
echo "Initiating the installation process..."

cd circom || exit
cargo build --release
cargo install --path circom
cd ..

# Update packages
sudo apt update

# Install Node.js and npm if not installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js and npm..."
    sudo apt install nodejs npm -y
else
    echo "Node.js and npm are already installed."
fi

# Check if snarkjs is globally installed
if ! command -v snarkjs &> /dev/null; then
    echo "Installing snarkjs globally..."
    npm install -g snarkjs
else
    echo "snarkjs is already installed globally."
fi

# Install circomlib locally
npm install circomlib
echo "Installation of Node packages successful."

# Prepare circuit
mkdir -p build
circom transfer.circom --r1cs --wasm --sym --c
clear
echo "Installation accomplished. Initiating SNARK for ZKP creation..."

# Generate witness
snarkjs wtns calculate transfer_js/transfer.wasm input.json witness.wtns
node transfer_js/generate_witness.js transfer_js/transfer.wasm input.json witness.wtns

# Powers of Tau ceremony
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
read -p "Please enter your name for contribution: " contributor
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="$contributor" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

# Create proving and verification keys
snarkjs zkey new transfer.r1cs pot12_final.ptau transfer_0000.zkey
snarkjs zkey contribute transfer_0000.zkey transfer_0001.zkey --name="$contributor" -v
snarkjs zkey export verificationkey transfer_0001.zkey verification_key.json

# Generate proof
snarkjs groth16 prove transfer_0001.zkey witness.wtns proof.json public.json

clear
echo "ZKP generation completed."
echo "Transmission procedures started..."

cargo build --release
cargo run

python3 reform_output.py

echo -e "\n\n\n\t\t\t✅ Zero Knowledge Proof Verification in Progress..."
snarkjs groth16 verify verification_key.json public.json received.json
