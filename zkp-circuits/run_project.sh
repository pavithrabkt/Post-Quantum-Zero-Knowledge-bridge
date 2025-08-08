git clone "https://github.com/iden3/circom.git"
clear
echo "Circom installed from the Global github repo : )"
echo "Initiating the installation process . . . . "		
cd circom
cargo build --release
cargo install --path circom
cd ..
sudo apt update
sudo apt install nodejs npm -y
npm install -g snarkjs
npm install circomlib
echo "Installation of Node packages successfull"
mkdir build
circom transfer.circom --r1cs --wasm --sym --c
clear
echo "Instllation Accomplished. Initiating SNARK for ZKP creation . . . ."
snarkjs wtns calculate transfer_js/transfer.wasm input.json witness.wtns
node transfer_js/generate_witness.js transfer_js/transfer.wasm input.json witness.wtns
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
read -p "Please enter your name for contribution : " contributor
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="$contributor" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
snarkjs zkey new transfer.r1cs pot12_final.ptau transfer_0000.zkey
snarkjs zkey contribute transfer_0000.zkey transfer_0001.zkey --name="$contributor" -v
snarkjs zkey export verificationkey transfer_0001.zkey verification_key.json
snarkjs groth16 prove transfer_0001.zkey witness.wtns proof.json public.json
clear
echo "ZKP generation Completed . . . "
echo "Transmission procedures started . . ."
cargo build --release
cargo run
