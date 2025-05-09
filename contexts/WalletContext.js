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
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }).catch((error) => {
        if (error.code === 4001) {
          // User rejected request
          throw new Error('Please connect your wallet to continue.');
        } else {
          throw error; // Re-throw other errors
        }
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.');
      }

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
      // Show user-friendly error message
      if (error.message.includes('connect your wallet')) {
        alert(error.message);
      } else {
        alert('Failed to connect wallet. Please try again.');
      }
      // Reset state on error
      disconnectWallet();
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
    // Reload the page on chain change as recommended by MetaMask
    window.location.reload();
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount('');
    setChainId('');
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
  };

  // Mock register image function for testing
  const registerImage = async (imageId, model) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // Simulate a transaction delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return a mock transaction hash
      return '0x' + Math.random().toString(16).substr(2, 64);
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

    // Cleanup event listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
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
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}; 