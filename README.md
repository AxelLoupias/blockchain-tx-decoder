# blockchain-tx-decoder

**blockchain-tx-decoder** is a library that decodes Ethereum transactions, extracting details such as basic transaction data, contract information, emitted events, and failure data in case of errors.

---

## 🚀 Installation

```bash
npm install blockchain-tx-decoder ethers
```

### Dependencies:

- [ethers.js](https://docs.ethers.org/): Used for handling Ethereum interactions.

---

## ⚙️ Setup

```typescript
import { TransactionDecoder } from 'blockchain-tx-decoder';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_KEY');
const contractsInfo = [
  {
    abi: [...], // Contract ABI
    bytecode: '0x...', // Optional: Bytecode for constructor transactions. Required if tx deploy a contract
  },
];

const decoder = new TransactionDecoder({ provider, contractsInfo });
```

---

## 📖 Usage

### 1. Get Transaction Data

```typescript
const txHash = '0x123abc...' // Transaction hash
const txData = await decoder.getTxData(txHash)
console.log(txData)
```

### 2. Response from `getTxData`

The method returns an object with three main parts:

- **`transactionData`**: Basic information (sender, recipient, status, value, etc.).
- **`contractData`**: Contract-related information such as the executed method, events, and arguments.
- **`revertData`** _(optional)_: Error details if the transaction failed (name and arguments).

---

## 🛠 API

### Class: `TransactionDecoder`

- **Constructor:**  
  `new TransactionDecoder({ provider, contractInfo })`

  - `provider`: A provider compatible with ethers.js.
  - `contractInfo`: List of objects containing the contract's ABI and bytecode.

- **Main Method:**  
  `getTxData(txHash: string): Promise<TxData>`
  - `txHash`: Transaction hash to analyze.
  - **Possible Errors:**
    - `InvalidTxHash`: If the hash is invalid.
    - `ContractNotFound`: If no compatible contract is found.
    - `ConstructorTransaction`: If it’s a constructor transaction and don't have the bytecode.
