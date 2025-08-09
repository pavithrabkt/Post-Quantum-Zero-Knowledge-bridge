# Post-Quantum-Zero-Knowledge-bridge
## Project Setup: ( [Click here for easy installation](#easy-setup) )

### Cloning

1. Clone the Repo
    
    ```bash
    git clone "https://github.com/Naveen-369/Post-Quantum-Zero-Knowledge-bridge.git"
    ```
    
2. Clone the Circom software
    
    ```bash
    git clone "https://github.com/iden3/circom.git"
    ```
    

### Set up the `CIRCOM` Software

1. Enter and release the build
    
    ```bash
    cd cargo/
    cargo build --release
    ```
    
2. Install the `circom` Software
    
    ```bash
    cargo install --path circom
    ```
    
3. Set up the *snark.js* 
    
    Install the `snark.js`  globally,
    
    ```bash
    npm install -g snarkjs
    ```
    

### Compilation

Compile the `transfer.circom` file

```bash
cd ..
circom transfer.circom --r1cs --wasm --sym --c
```

### Validation and  Witness Computation

1. Validation of correctness among the folders and files throughout the project
    
    ```bash
    snarkjs wtns calculate transfer_js/transfer.wasm input.json witness.wtns
    ```
    
2. Witness Computation
    
    ```bash
    node transfer_js/generate_witness.js transfer_js/transfer.wasm input.json witness.wtns
    ```
    

### Proving Circuits

```bash
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
```

```bash
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="Naveen Kumar" -v
```

```bash
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
```

```bash
snarkjs zkey new transfer.r1cs pot12_final.ptau transfer_0000.zkey
```

```bash
snarkjs zkey contribute transfer_0000.zkey transfer_0001.zkey --name="Naveen Kumar" -v
```

```bash
snarkjs zkey export verificationkey transfer_0001.zkey verification_key.json
```

### Generation of the Proof

```bash
snarkjs groth16 prove transfer_0001.zkey witness.wtns proof.json public.json
```

### Verification of the proof

```bash
snarkjs groth16 verify verification_key.json public.json proof.json
```

<hr/>

## Easy setup
- Install wsl using the following command before proceeding. Use `Powershell`
  ```bash
  wsl --install
  cd /mnt/
  cd <folderPath>
  curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
  ```
- Configure Git and Node if not configured properly.
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  sudo apt update
  sudo apt install nodejs npm -y
  git clone "https://github.com/Naveen-369/Post-Quantum-Zero-Knowledge-bridge.git"
  ```
- Get into the project directory, activate execution permission and run the script file
  ```bash
  cd Post-Quantum-Zero-Knowledge-bridge
  cd zkp-circuits
  chmod +x run_project.sh
  ```
🚀 **It will take `10 to 15` mins solid. Just run the above command.**  
🔐 It might ask you for `User_Password` once and prompt for a random key twice.
  
