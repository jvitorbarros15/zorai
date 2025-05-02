import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F1F5F9]">
      <Head>
        <title>ZorAi - AI Image Verification</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="description" content="Verify and register AI-generated images on the blockchain" />
      </Head>

      {/* Header */}
      <header className="border-b border-[#1E293B] bg-[#0F172A]/90 backdrop-blur-sm sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <Image src="/logo.svg" alt="ZorAi Logo" width={120} height={40} priority />
            </Link>
            
            {/* Navigation */}
            <div className="flex items-center gap-3 justify-end flex-1">
              <Link href="/" className="ml-auto">
                <button className="bg-[#334155] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#475569] transition-all duration-200 shadow-sm hover:shadow-md text-sm">
                  Home
                </button>
              </Link>
              <Link href="/submit">
                <button className="bg-[#334155] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#475569] transition-all duration-200 shadow-sm hover:shadow-md text-sm">
                  Register New Image
                </button>
              </Link>
              <Link href="/about">
                <button className="bg-[#334155] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#475569] transition-all duration-200 shadow-sm hover:shadow-md text-sm">
                  About
                </button>
              </Link>
              <Link href="/generate-ai-image">
                <button className="bg-[#334155] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#475569] transition-all duration-200 shadow-sm hover:shadow-md text-sm">
                  Generate AI Image
                </button>
              </Link>
              <Link href="/connect">
                <button className="bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-[#0F172A] px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md text-sm">
                  Connect Wallet
                </button>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1E293B] py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Image src="/logo.svg" alt="ZorAi Logo" width={100} height={33} />
              <p className="mt-4 text-sm text-[#94A3B8]">
                Verify and register AI-generated images on the blockchain
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <div className="space-y-2">
                <a
                  href="https://github.com/jvitorbarros15/zorai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-[#94A3B8] hover:text-[#00F5D4]"
                >
                  GitHub
                </a>
                <a
                  href="https://etherscan.io/address/your-contract-address"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-[#94A3B8] hover:text-[#00F5D4]"
                >
                  Smart Contract
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-[#1E293B] text-center text-sm text-[#94A3B8]">
            <p>© 2025 ZorAi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 