import Layout from '../components/layout/Layout';

export default function About() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">About ZorAi</h1>
        
        <div className="space-y-8">
          {/* Project Description */}
          <section className="bg-[#1E293B] p-6 rounded-lg border border-[#334155]">
            <h2 className="text-xl font-semibold mb-4 text-[#00F5D4]">What is ZorAi?</h2>
            <p className="text-[#F1F5F9] mb-4">
              ZorAi is a decentralized application that verifies and registers AI-generated image IDs on the blockchain. 
              Our platform provides a secure and transparent way to track and verify the origin of AI-generated content.
            </p>
            <p className="text-[#F1F5F9]">
              By leveraging blockchain technology, we ensure that each AI-generated image can be traced back to its source 
              and verified for authenticity, helping to combat misinformation and establish trust in AI-generated content.
            </p>
          </section>

          {/* How It Works */}
          <section className="bg-[#1E293B] p-6 rounded-lg border border-[#334155]">
            <h2 className="text-xl font-semibold mb-4 text-[#00F5D4]">How It Works</h2>
            <ol className="list-decimal list-inside space-y-4 text-[#F1F5F9]">
              <li>Users submit AI-generated images with their unique IDs</li>
              <li>The system verifies the image's origin and AI model used</li>
              <li>Verified information is stored on the blockchain</li>
              <li>Anyone can verify the authenticity of an image using its ID</li>
            </ol>
          </section>

          {/* Connect Wallet Section */}
          <section className="bg-[#1E293B] p-6 rounded-lg border border-[#334155]">
            <h2 className="text-xl font-semibold mb-4 text-[#00F5D4]">Get Started</h2>
            <p className="text-[#F1F5F9] mb-4">
              Connect your MetaMask wallet to start verifying and registering AI-generated images.
            </p>
            <button
              className="px-6 py-3 bg-[#00F5D4] text-[#0F172A] font-semibold rounded-lg hover:bg-opacity-90 transition-colors"
              onClick={() => {
                // TODO: Implement MetaMask connection
                console.log('Connect wallet clicked');
              }}
            >
              Connect Wallet
            </button>
          </section>

          {/* Links */}
          <section className="bg-[#1E293B] p-6 rounded-lg border border-[#334155]">
            <h2 className="text-xl font-semibold mb-4 text-[#00F5D4]">Links</h2>
            <div className="space-y-2">
              <a
                href="https://github.com/yourusername/zorai"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[#00F5D4] hover:text-opacity-80 transition-colors"
              >
                GitHub Repository
              </a>
              <a
                href="https://etherscan.io/address/your-contract-address"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[#00F5D4] hover:text-opacity-80 transition-colors"
              >
                Smart Contract
              </a>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
} 