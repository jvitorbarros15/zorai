# ZorAi

ZorAi is a decentralized AI image verification application. It creates a verifiable record for AI-generated images by combining content metadata, IPFS storage, and an on-chain registry deployed on Base Sepolia.

The application is built with Next.js, React, Tailwind CSS, Solidity, Hardhat, and ethers.js.

## Overview

ZorAi helps users register and verify AI-generated image identifiers. Each registration can include an image hash, the AI model used, an IPFS metadata reference, a verification status, and risk assessment information.

The registry contract provides a public source of truth for image provenance data. The frontend and API routes interact with the contract to submit new records and verify existing ones.

## Features

- Register AI-generated image records on Base Sepolia.
- Verify whether an image hash has already been registered.
- Store metadata references using IPFS CIDs.
- Track the AI model associated with each image record.
- Include risk level and risk reason metadata.
- Connect with browser wallets such as MetaMask.
- Provide API routes for registration and verification workflows.

## Tech Stack

- **Frontend**: Next.js, React
- **Styling**: Tailwind CSS
- **Smart Contracts**: Solidity
- **Blockchain Tooling**: Hardhat, ethers.js
- **Network**: Base Sepolia
- **Storage**: IPFS through Pinata
- **Wallet Support**: MetaMask and EVM-compatible wallets

## Smart Contract

The deployed registry contract is `ZorAiRegistry`.

### Base Sepolia Deployment

| Field | Value |
| --- | --- |
| Network | Base Sepolia |
| Chain ID | `84532` |
| Contract Address | `0xd11eAEA00A92E6eE97DD14e6F97dbBb7971ef549` |
| Explorer | https://sepolia.basescan.org/address/0xd11eAEA00A92E6eE97DD14e6F97dbBb7971ef549 |

### Core Methods

```solidity
registerImage(
  string memory imageId,
  string memory modelUsed,
  string memory ipfsHash,
  RiskLevel riskLevel,
  string[] memory riskReasons
)
```

Registers a new image record on-chain.

```solidity
getImageData(string memory imageId)
```

Returns the stored metadata for a registered image.

```solidity
isImageRegistered(string memory imageId)
```

Returns whether an image ID already exists in the registry.

## Metadata Format

Image metadata can be stored on IPFS using a JSON structure similar to:

```json
{
  "imageId": "sha256 hash string",
  "modelUsed": "AI model name",
  "timestamp": "ISO timestamp or Unix timestamp",
  "riskCategory": "low | medium | high",
  "riskReasons": ["reason one", "reason two"]
}
```

## Environment Variables

Create a local `.env` file for development and contract deployment.

```bash
PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
NEXT_PUBLIC_CONTRACT_ADDRESS=0xd11eAEA00A92E6eE97DD14e6F97dbBb7971ef549
ZORAI_SIGNER_PRIVATE_KEY=0xYOUR_SERVER_SIGNER_PRIVATE_KEY
ZORAI_RPC_URL=https://sepolia.base.org
ZORAI_API_KEY=your_api_key
```

`PRIVATE_KEY` is used by Hardhat deployment scripts. `ZORAI_SIGNER_PRIVATE_KEY` is used by server-side API routes that write to the contract. Do not expose private keys in client-side environment variables or commit them to git.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run the Hardhat compiler:

```bash
npx hardhat compile
```

Deploy the contract to Base Sepolia:

```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

## Project Structure

```text
zorai-app/
├── components/          Reusable React components
├── contexts/            React context providers
├── contracts/           Solidity contract and ABI files
├── lib/                 Blockchain and registry helpers
├── pages/               Next.js pages and API routes
├── public/              Static assets
├── scripts/             Hardhat deployment scripts
├── styles/              Global styles
├── hardhat.config.js    Hardhat network configuration
└── package.json         Project scripts and dependencies
```

## API Routes

The app includes server-side API routes for verification and registration.

### Register

```http
POST /api/register
```

Registers an image record using the configured server-side signer.

Required headers:

```http
x-api-key: your_api_key
```

Required body fields:

```json
{
  "imageHash": "sha256 hash string",
  "modelUsed": "AI model name",
  "ipfsHash": "IPFS CID"
}
```

Optional body fields include `riskLevel`, `riskReasons`, `company`, `externalId`, `sourceUrl`, and `contentType`.

### Verify

```http
GET /api/verify
```

Looks up an image record from the deployed registry contract.

## Deployment

1. Configure production environment variables in the hosting provider.
2. Set `NEXT_PUBLIC_CONTRACT_ADDRESS` to the deployed Base Sepolia contract address.
3. Set `ZORAI_SIGNER_PRIVATE_KEY` only if server-side registration is required.
4. Configure Pinata and any AI provider credentials needed by the application.
5. Deploy the Next.js application to Vercel or another Node-compatible hosting provider.
6. Test registration and verification against Base Sepolia.

## Security Notes

- Never commit `.env`, private keys, API keys, or seed phrases.
- Use a dedicated test wallet for Base Sepolia deployments.
- Keep server-side signing keys out of frontend code.
- Rotate keys if they are exposed in screenshots, logs, or chat.
- Use Base Sepolia test ETH only for testnet transactions.

## License

MIT
