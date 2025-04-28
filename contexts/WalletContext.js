import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined';
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      alert('Please install MetaMask to use this application');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setAccount(accounts[0]);
      setChainId(network.chainId.toString());
      setProvider(provider);
      setSigner(signer);
      setIsConnected(true);

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      // Listen for chain changes
      window.ethereum.on('chainChanged', handleChainChanged);
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      alert('Error connecting to MetaMask. Please try again.');
    }
  };

  // Handle account changes
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      disconnectWallet();
    } else {
      setAccount(accounts[0]);
    }
  };

  // Handle chain changes
  const handleChainChanged = (chainId) => {
    setChainId(chainId);
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount('');
    setChainId('');
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
  };

  // Register image on blockchain
  const registerImage = async (imageId, model) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // TODO: Replace with your actual contract address and ABI
      const contractAddress = 'YOUR_CONTRACT_ADDRESS';
      const contractABI = []; // Your contract ABI here

      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.registerImage(imageId, model);
      await tx.wait();

      return tx.hash;
    } catch (error) {
      console.error('Error registering image:', error);
      throw error;
    }
  };

  // Check if wallet is already connected on page load
  useEffect(() => {
    const checkConnection = async () => {
      if (isMetaMaskInstalled() && window.ethereum.selectedAddress) {
        await connectWallet();
      }
    };

    checkConnection();
  }, []);

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        isConnected,
        connectWallet,
        disconnectWallet,
        registerImage,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}; 