import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ZorAiRegistry from '../contracts/ZorAiRegistry.json';

const BlockchainContext = createContext();

// Network configurations
const NETWORKS = {
  bnbTestnet: {
    chainId: '0x61',
    chainName: 'BNB Smart Chain Testnet',
    nativeCurrency: {
      name: 'tBNB',
      symbol: 'tBNB',
      decimals: 18
    },
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    blockExplorerUrls: ['https://testnet.bscscan.com']
  }
};

export function BlockchainProvider({ children }) {
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isContractDeployed, setIsContractDeployed] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [currentNetwork, setCurrentNetwork] = useState(null);

  useEffect(() => {
    initializeContract();
    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      setLastRefresh(Date.now());
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  const switchToBnbTestnet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: NETWORKS.bnbTestnet.chainId }],
        });
      }
    } catch (switchError) {
      
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [NETWORKS.bnbTestnet],
          });
        } catch (addError) {
          console.error('Error adding BNB Testnet:', addError);
          throw new Error('Failed to add BNB Testnet to MetaMask');
        }
      } else {
        throw switchError;
      }
    }
  };

  const initializeContract = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum, {
          name: 'bnb-testnet',
          chainId: 97,
          ensAddress: null
        });
        // Get the network from MetaMask for UI status
        const network = await provider.getNetwork();
        setCurrentNetwork(network);
        // Check if we're on BNB Testnet (fix: always compare as number)
        const chainId = Number(network.chainId) || Number(window.ethereum.chainId);
        if (chainId !== 97) {
          // Prompt user to switch network
          try {
            await switchToBnbTestnet();
            // After switching, reload to re-init contract
            window.location.reload();
            return;
          } catch (switchErr) {
            setError('Please switch to BNB Smart Chain Testnet in MetaMask to use this app.');
            setIsContractDeployed(false);
            setIsLoading(false);
            return;
          }
        }

        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        if (!contractAddress) {
          throw new Error('Contract address not found in environment variables');
        }

        // Check if contract is deployed
        const code = await provider.getCode(contractAddress);
        if (code === '0x') {
          throw new Error('Contract is not deployed at the specified address');
        }

        // Fix: Get signer manually to avoid ENS resolution
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const signer = provider.getSigner(accounts[0]);

        // Use the signer for contract interactions
        const contract = new ethers.Contract(
          contractAddress,
          ZorAiRegistry.abi,
          signer
        );
        
        setContract(contract);
        setIsContractDeployed(true);
        setError(null);
      } else {
        throw new Error('Please install MetaMask to use this feature');
      }
    } catch (err) {
      console.error('Error initializing contract:', err);
      // Filter out ENS-related errors as they're not critical
      if (err.code === 'UNSUPPORTED_OPERATION' && err.operation === 'getEnsAddress') {
        setError('Please switch to BNB Smart Chain Testnet');
      } else {
        setError(err.message);
      }
      setIsContractDeployed(false);
    } finally {
      setIsLoading(false);
    }
  };

  const registerImage = async (imageId, modelUsed, ipfsHash, riskLevel, riskReasons) => {
    try {
      if (!isContractDeployed) {
        throw new Error('Contract is not deployed');
      }

      // Always get a fresh signer from BrowserProvider for writing
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const signer = await browserProvider.getSigner(accounts[0]);
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      const contractWithSigner = new ethers.Contract(
        contractAddress,
        ZorAiRegistry.abi,
        signer
      );

      const tx = await contractWithSigner.registerImage(
        imageId,
        modelUsed,
        ipfsHash,
        riskLevel,
        riskReasons
      );
      await tx.wait();
      setLastRefresh(Date.now()); // Trigger refresh after registration
      return true;
    } catch (err) {
      console.error('Error registering image:', err);
      throw err;
    }
  };

  const getImageData = async (imageId) => {
    try {
      // Always use a read-only provider for reads
      const provider = new ethers.JsonRpcProvider('https://bsc-testnet.bnbchain.org', 97);
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      const contractReadOnly = new ethers.Contract(
        contractAddress,
        ZorAiRegistry.abi,
        provider
      );

      const data = await contractReadOnly.getImageData(imageId);
      return {
        ipfsHash: data[0],
        modelUsed: data[1],
        creator: data[2],
        timestamp: new Date(Number(data[3]) * 1000).toISOString(),
        isVerified: data[4],
        riskLevel: data[5],
        riskReasons: data[6]
      };
    } catch (err) {
      console.error('Error getting image data:', err);
      throw err;
    }
  };

  const getHighRiskImages = async () => {
    try {
      if (!isContractDeployed) {
        throw new Error('Contract is not deployed');
      }

      const imageIds = await contract.getHighRiskImages();
      const images = await Promise.all(
        imageIds.map(id => getImageData(id))
      );
      return images;
    } catch (err) {
      console.error('Error getting high-risk images:', err);
      throw err;
    }
  };

  // Fetch all registered images and filter for medium or high risk
  const getMediumAndHighRiskImages = async () => {
    try {
      if (!isContractDeployed) {
        throw new Error('Contract is not deployed');
      }
      // Use a read-only provider for contract calls
      const provider = new ethers.JsonRpcProvider('https://bsc-testnet.bnbchain.org', 97);
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      const contractReadOnly = new ethers.Contract(
        contractAddress,
        ZorAiRegistry.abi,
        provider
      );
      const total = await contractReadOnly.getTotalImages();
      const imageIds = [];
      for (let i = 0; i < total; i++) {
        const id = await contractReadOnly.registeredImages(i);
        imageIds.push(id);
      }
      const images = await Promise.all(imageIds.map(id => getImageData(id)));
      // riskLevel: 1 = medium, 2 = high
      return images.filter(img => Number(img.riskLevel) === 1 || Number(img.riskLevel) === 2);
    } catch (err) {
      console.error('Error getting medium/high risk images:', err);
      throw err;
    }
  };

  const value = {
    contract,
    isLoading,
    error,
    isContractDeployed,
    lastRefresh,
    currentNetwork,
    switchToBnbTestnet,
    registerImage,
    getImageData,
    getHighRiskImages,
    getMediumAndHighRiskImages
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
}

export function useBlockchain() {
  const context = useContext(BlockchainContext);
  if (context === undefined) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
} 