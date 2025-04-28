import { ethers } from 'ethers';

// Network configurations
export const NETWORKS = {
  sepolia: {
    name: 'Sepolia',
    chainId: 11155111,
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
    explorerUrl: 'https://sepolia.etherscan.io',
  },
  // Add more networks as needed
};

// Contract configurations
export const CONTRACT = {
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  abi: [], // Will be populated after contract deployment
};

// Provider setup
export const getProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return new ethers.JsonRpcProvider(NETWORKS.sepolia.rpcUrl);
};

// Contract instance setup
export const getContract = async () => {
  const provider = getProvider();
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT.address, CONTRACT.abi, signer);
};

// Helper functions
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const isValidAddress = (address) => {
  return ethers.isAddress(address);
};

// Error handling
export const handleBlockchainError = (error) => {
  let message = 'An error occurred';
  
  if (error.code === 4001) {
    message = 'Transaction was rejected by user';
  } else if (error.code === -32603) {
    message = 'Transaction failed';
  } else if (error.message.includes('insufficient funds')) {
    message = 'Insufficient funds for transaction';
  } else if (error.message.includes('user rejected')) {
    message = 'Transaction was rejected';
  }
  
  return message;
}; 