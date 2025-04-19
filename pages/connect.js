import Layout from '../components/layout/Layout';

export default function Connect() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-[#00F5D4]">Connect Your Wallet</h1>
        
        {/* Wallet Connection Section */}
        <div className="bg-[#1E293B] p-8 rounded-lg">
          <div className="text-center space-y-6">
            <p className="text-[#F1F5F9] text-lg">
              Connect your wallet to start registering and verifying AI-generated images on the blockchain.
            </p>
            
            <div className="space-y-4">
              <button 
                className="w-full bg-[#334155] text-white px-6 py-4 rounded-lg font-medium hover:bg-[#475569] transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3"
                onClick={() => {
                  // TODO: Implement MetaMask connection
                  console.log('Connect MetaMask clicked');
                }}
              >
                <img src="/metamask-logo.svg" alt="MetaMask" className="w-6 h-6" />
                Connect with MetaMask
              </button>
            </div>

            <p className="text-[#94A3B8] text-sm">
              By connecting your wallet, you agree to our Terms of Service and Privacy Policy.
            </p>
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