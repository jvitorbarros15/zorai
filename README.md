# ZorAi - Decentralized AI Image Verification

ZorAi is a decentralized application that verifies and registers AI-generated image IDs on the blockchain, integrating with IPFS for metadata storage and optionally with ChatGPT for prompt generation.

## 🎯 Objective

Build a decentralized application (dApp) that:
- Connects to the ChatGPT API (or accepts user prompts)
- Generates a unique image ID (SHA256 hash of prompt + timestamp + model)
- Uploads metadata to IPFS via Pinata Cloud
- Stores image verification data on the Polygon blockchain
- Provides a public frontend for users to submit and verify image IDs

## 🚀 Features

- **Blockchain Integration**: Register and verify AI-generated images on Polygon
- **IPFS Storage**: Secure metadata storage via Pinata Cloud
- **Modern UI**: Clean, minimalist design with dark theme
- **Wallet Integration**: Seamless MetaMask connection
- **ChatGPT Integration**: Optional AI-powered prompt generation
- **Responsive Design**: Works across all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Solidity, ethers.js, MetaMask
- **Storage**: IPFS (Pinata Cloud)
- **AI**: OpenAI GPT API (optional)
- **Fonts**: Space Grotesk / Sora

## 🔧 Smart Contract

### Storage
- `string imageId`
- `string modelUsed`
- `string ipfsHash`
- `uint256 timestamp`

### Functions
- `registerImage(string memory imageId, string memory modelUsed, string memory ipfsHash)`
- `getImageData(string memory imageId) returns (address creator, string memory modelUsed, string memory ipfsHash, uint256 timestamp)`

## 📦 IPFS Metadata Format
```json
{
  "imageId": "sha256 hash string",
  "modelUsed": "AI model name",
  "timestamp": "unix timestamp",
  "riskCategory": "optional risk label"
}
```

## 🎨 Design System

- **Background**: `#0F172A`
- **Text**: `#F1F5F9`
- **Accent**: `#00F5D4`
- **Font**: Space Grotesk / Sora

## 📋 Project Checklist

### Smart Contract Development
- [ ] Write Solidity smart contract
- [ ] Add image registration function
- [ ] Add data retrieval function
- [ ] Deploy to Polygon Mumbai testnet
- [ ] Deploy to Polygon Mainnet
- [ ] Generate and export ABI

### IPFS Integration
- [ ] Set up Pinata Cloud SDK
- [ ] Implement metadata JSON creation
- [ ] Add IPFS upload functionality
- [ ] Handle CID storage and retrieval
- [ ] Implement gateway-based content fetching

### Frontend Development
- [x] Initialize Next.js project with TypeScript
- [x] Install and configure Tailwind CSS
- [x] Set up project structure
- [x] Configure fonts and theme
- [x] Create WalletContext for MetaMask
- [x] Implement basic UI components

### Pages
- [x] Home/Dashboard
  - [x] Search bar for image ID
  - [x] Display verified images
  - [x] Navigation setup
- [x] Submit Page
  - [x] Image ID input
  - [x] AI model selection
  - [ ] ChatGPT prompt generation
  - [ ] IPFS metadata upload
  - [ ] Blockchain registration
- [x] About Page
  - [x] Project explanation
  - [x] Connect Wallet integration
  - [ ] Technical documentation

### ChatGPT Integration
- [ ] Set up OpenAI API connection
- [ ] Add prompt generation UI
- [ ] Implement error handling
- [ ] Add rate limiting
- [ ] Store API keys securely

### Security & DevOps
- [ ] Secure environment variable handling
- [ ] Implement API routes for key operations
- [ ] Add error boundaries
- [ ] Set up CI/CD pipeline
- [ ] Create deployment documentation

## 📁 Project Structure
```
zorai-app/
├── components/         # Reusable UI components
├── contexts/          # React contexts (wallet, etc.)
├── contracts/         # Solidity smart contracts
├── hooks/            # Custom React hooks
├── pages/            # Next.js pages
├── public/           # Static assets
├── styles/           # Global styles
├── types/            # TypeScript definitions
└── utils/            # Helper functions
```

## 🔐 Security Notes

- Store API keys in `.env.local`
- Use Next.js API routes for sensitive operations
- Implement proper error handling
- Follow blockchain security best practices

## 🚀 Deployment

1. Deploy smart contracts to Polygon network
2. Set up Pinata Cloud account and API keys
3. Configure environment variables
4. Deploy frontend to Vercel or similar
5. Test end-to-end functionality

## 📜 License

MIT
