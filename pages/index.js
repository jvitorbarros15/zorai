import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Link from 'next/link';
import { useBlockchain } from '../contexts/BlockchainContext';
import { useWallet } from '../contexts/WalletContext';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [images, setImages] = useState([]);
  const [highRiskImages, setHighRiskImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { 
    getMediumAndHighRiskImages, 
    isLoading: isBlockchainLoading, 
    error: blockchainError, 
    isContractDeployed, 
    lastRefresh,
    currentNetwork,
    switchToBnbTestnet 
  } = useBlockchain();
  const { isConnected } = useWallet();

  useEffect(() => {
    // Load images from localStorage
    const storedImages = JSON.parse(localStorage.getItem('registeredImages') || '[]');
    setImages(storedImages);
    loadMediumAndHighRiskImages();
  }, [isConnected, lastRefresh]); // Reload when wallet connects or data refreshes

  const loadMediumAndHighRiskImages = async () => {
    try {
      if (isConnected && isContractDeployed) {
        setIsLoading(true);
        const blockchainImages = await getMediumAndHighRiskImages();
        setHighRiskImages(blockchainImages);
      }
    } catch (error) {
      console.error('Error loading medium/high-risk images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (imageId) => {
    // Filter out the image to be deleted
    const updatedImages = images.filter(image => image.id !== imageId);
    // Update localStorage
    localStorage.setItem('registeredImages', JSON.stringify(updatedImages));
    // Update state
    setImages(updatedImages);
  };

  const filteredImages = images.filter(image =>
    image.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHighRiskImages = highRiskImages.filter(image =>
    image.ipfsHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.modelUsed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSwitchNetwork = async () => {
    try {
      await switchToBnbTestnet();
    } catch (error) {
      console.error('Error switching network:', error);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-transparent bg-clip-text">
            Verify AI-Generated Images
          </h1>
          <p className="text-lg text-[#94A3B8] max-w-xl mx-auto">
            Secure and transparent verification of AI-generated content on the blockchain
          </p>
        </div>

        {/* Network Status */}
        {isConnected && (
          <div className="mb-6">
            <div className="bg-[#1E293B] p-4 rounded-lg border border-[#334155]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    currentNetwork?.chainId === BigInt('0x61') 
                      ? 'bg-green-500' 
                      : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-sm text-[#94A3B8]">
                    {currentNetwork?.chainId === BigInt('0x61')
                      ? 'Connected to BNB Smart Chain Testnet'
                      : 'Wrong Network'}
                  </span>
                </div>
                {currentNetwork?.chainId !== BigInt('0x61') && (
                  <button
                    onClick={handleSwitchNetwork}
                    className="bg-[#00F5D4] text-[#0F172A] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00D4F5] transition-colors"
                  >
                    Switch to BNB Testnet
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by Image ID or AI Model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-[#1E293B] border border-[#334155] rounded-lg focus:outline-none focus:border-[#00F5D4] text-[#F1F5F9] placeholder-[#94A3B8] text-sm"
            />
          </div>
        </div>

        {/* Error Messages */}
        {blockchainError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{blockchainError}</p>
          </div>
        )}

        {/* Medium/High-Risk Images Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-red-400">Medium/High-Risk Images (Blockchain Verified)</h2>
            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                <span className="text-sm text-[#94A3B8]">Loading...</span>
              </div>
            )}
          </div>
          {!isContractDeployed ? (
            <div className="bg-[#1E293B] p-4 rounded-lg border border-red-500/20">
              <p className="text-red-400 text-sm">Contract is not deployed. Please check your configuration.</p>
            </div>
          ) : filteredHighRiskImages.length === 0 ? (
            <div className="bg-[#1E293B] p-4 rounded-lg border border-[#334155]">
              <p className="text-[#94A3B8] text-sm">No high-risk images found.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredHighRiskImages.map((image) => (
                (() => { console.log('Blockchain image object:', image); return null; })(),
                <div
                  key={image.ipfsHash}
                  className="bg-[#1E293B] p-4 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    {/* Image Preview */}
                    <div className="w-[40px] h-[40px] relative flex-shrink-0">
                      {(() => { console.log('ipfsHash for image:', image.ipfsHash); return null; })()}
                      {image.ipfsHash && (image.ipfsHash.startsWith('Qm') || image.ipfsHash.startsWith('bafy')) ? (
                        <img 
                          src={`https://gateway.pinata.cloud/ipfs/${image.ipfsHash}`}
                          alt={image.ipfsHash}
                          className="w-full h-full object-contain rounded-lg border border-[#334155]"
                        />
                      ) : (
                        <span className="text-xs text-[#94A3B8]">No image</span>
                      )}
                    </div>
                    
                    {/* Image Details */}
                    <div className="flex-1">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-red-400">Blockchain Verified</h3>
                          <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
                            High Risk
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <p className="text-[#94A3B8]">Generated with {image.modelUsed}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[#94A3B8] text-xs">{image.timestamp}</span>
                          </div>
                        </div>
                        {image.riskReasons && image.riskReasons.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-[#94A3B8]">Risk Reasons:</p>
                            <ul className="list-disc list-inside text-xs text-red-400">
                              {image.riskReasons.map((reason, index) => (
                                <li key={index}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Regular Images Section */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-[#00F5D4]">Registered Images</h2>
          <div className="grid gap-2">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="bg-[#1E293B] p-4 rounded-lg border border-[#334155] hover:border-[#00F5D4] transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center gap-4">
                  {/* Small Image Preview */}
                  {image.imageData && (
                    <div className="w-[40px] h-[40px] relative flex-shrink-0">
                      <img 
                        src={image.imageData} 
                        alt={image.id} 
                        className="w-full h-full object-contain rounded-lg border border-[#334155]"
                      />
                    </div>
                  )}
                  
                  {/* Image Details */}
                  <div className="flex-1">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[#00F5D4]">{image.id}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          image.status === 'Verified' 
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {image.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-[#94A3B8]">Generated with {image.model}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[#94A3B8] text-xs">{image.date}</span>
                          <button
                            onClick={() => handleDelete(image.id)}
                            className="text-red-500 hover:text-red-400 transition-colors bg-red-500/10 p-1 rounded-full"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-5 w-5" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M6 18L18 6M6 6l12 12" 
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-6 text-center">
          <Link href="/submit">
            <button className="bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-[#0F172A] px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2 group inline-flex">
              <span>Register New Image</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 transform group-hover:rotate-90 transition-transform duration-200" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </Link>
        </div>
      </div>
    </Layout>
  );
} 