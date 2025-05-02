import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { useWallet } from '../contexts/WalletContext';

export default function Connect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const { connectWallet, isConnected, account, disconnectWallet } = useWallet();

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    try {
      await connectWallet();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error.message || 'Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-transparent bg-clip-text text-center">Connect Your Wallet</h1>
        
        <div className="bg-[#1E293B] rounded-lg p-8 shadow-lg">
          <div className="space-y-6">
            {/* MetaMask Option */}
            <div className="bg-[#0F172A] rounded-lg p-6">
              <div className="flex flex-col items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <img 
                    src="/metamask-logo.svg" 
                    alt="MetaMask" 
                    className="w-20 h-20 mb-2"
                  />
                  <h3 className="text-2xl font-bold text-center">MetaMask</h3>
                  <p className="text-base text-[#94A3B8] text-center">Connect using MetaMask wallet</p>
                  {error && (
                    <p className="text-red-500 text-sm text-center mt-2">{error}</p>
                  )}
                </div>
                <button 
                  className="w-32 bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-[#0F172A] px-6 py-3 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                  onClick={handleConnect}
                  disabled={isConnecting || isConnected}
                >
                  {isConnecting ? (
                    <span>Connecting...</span>
                  ) : isConnected ? (
                    <>
                      <span>Connected</span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Connect</span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
              {isConnected && account && (
                <div className="mt-4 p-4 bg-[#334155] rounded-lg flex flex-col items-center">
                  <p className="text-sm text-[#94A3B8]">Connected Account:</p>
                  <p className="text-sm font-mono">{account}</p>
                  <button
                    onClick={disconnectWallet}
                    className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-all"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Why Connect Section */}
        <div className="mt-12 bg-[#1E293B] p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-6 text-white">Why Connect Your Wallet?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-[#00F5D4]">Register Images</h3>
              <p className="text-[#F1F5F9]">
                Register your AI-generated images on the blockchain for permanent verification and proof of origin.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-[#00F5D4]">Track History</h3>
              <p className="text-[#F1F5F9]">
                Access your complete history of registered images and verification records.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-[#00F5D4]">Verify Authenticity</h3>
              <p className="text-[#F1F5F9]">
                Verify the authenticity and origin of any registered AI-generated image.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-[#00F5D4]">Secure Storage</h3>
              <p className="text-[#F1F5F9]">
                Your image IDs are securely stored on the blockchain, ensuring permanent accessibility.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 