import Layout from '../components/layout/Layout';
import Link from 'next/link';

export default function About() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="flex flex-col items-center justify-center gap-4 mb-6">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-transparent bg-clip-text mb-2">ZorAi</h1>
            <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">Decentralized AI Image Verification for a Trustworthy Digital World</p>
          </div>
        </section>

        {/* What is ZorAi Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-[#00F5D4] text-center">What is ZorAi?</h2>
          <div className="space-y-6 text-[#F1F5F9]">
            <p>
              ZorAi is a decentralized application designed to verify and register AI-generated image IDs on the blockchain. Our platform brings transparency, traceability, and trust to the world of generative AI by allowing anyone to check whether a visual asset was created by artificial intelligence, and if so, when, how, and by whom.
            </p>
            <p>
              In a digital era where misinformation spreads fast and AI-generated visuals are increasingly indistinguishable from real ones, ZorAi serves as a trust layer, enabling creators, platforms, and users to authenticate the origin of AI-generated content through a public, immutable record.
            </p>
            <p>
              ZorAi is built for developers, creators, journalists, and platforms who believe in the importance of accountability and digital integrity in the age of artificial intelligence.
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section>
          <h2 className="text-2xl font-bold mb-8 text-[#00F5D4] text-center">How It Works</h2>
          <div className="space-y-8">
            <div className="bg-[#1E293B] p-6 rounded-lg flex items-start gap-4 shadow-lg">
              <span className="bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-[#0F172A] rounded-full p-3 flex items-center justify-center shadow-md">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
              </span>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">Step 1: Image Is Created by AI</h3>
                <p className="text-[#F1F5F9]">An image is generated using an AI tool (e.g., DALL·E, Midjourney, etc.), either directly through ZorAi or another platform.</p>
              </div>
            </div>

            <div className="bg-[#1E293B] p-6 rounded-lg flex items-start gap-4 shadow-lg">
              <span className="bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-[#0F172A] rounded-full p-3 flex items-center justify-center shadow-md">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
              </span>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">Step 2: A Unique Image ID Is Generated</h3>
                <p className="text-[#F1F5F9]">ZorAi automatically (or manually) generates a unique ID using a secure hashing algorithm. This ID is derived from factors like the prompt, timestamp, and AI model used — making it a reliable fingerprint of the image's origin.</p>
              </div>
            </div>

            <div className="bg-[#1E293B] p-6 rounded-lg flex items-start gap-4 shadow-lg">
              <span className="bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-[#0F172A] rounded-full p-3 flex items-center justify-center shadow-md">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2l4-4" /><circle cx="12" cy="12" r="10" /></svg>
              </span>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">Step 3: Content Risk Filter (Optional)</h3>
                <p className="text-[#F1F5F9]">Before registering the ID, ZorAi can run the prompt or image through a risk filter (e.g., via OpenAI moderation API or image classifiers) to detect potential for misinformation or sensitive content.</p>
                <p className="text-[#F1F5F9] mt-2">Only images with potential impact (e.g., impersonation, political content, news-related visuals) may be logged on-chain.</p>
              </div>
            </div>

            <div className="bg-[#1E293B] p-6 rounded-lg flex items-start gap-4 shadow-lg">
              <span className="bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-[#0F172A] rounded-full p-3 flex items-center justify-center shadow-md">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="7" rx="2" /><path d="M16 11V7a4 4 0 00-8 0v4" /></svg>
              </span>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">Step 4: ID Is Registered on the Blockchain</h3>
                <p className="text-[#F1F5F9]">If the image passes the filter, its unique ID is stored on the blockchain via a smart contract. This ensures:</p>
                <ul className="list-disc list-inside mt-3 text-[#F1F5F9] space-y-1 ml-4">
                  <li>Permanent record</li>
                  <li>Public visibility</li>
                  <li>Proof of provenance</li>
                </ul>
              </div>
            </div>

            <div className="bg-[#1E293B] p-6 rounded-lg flex items-start gap-4 shadow-lg">
              <span className="bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-[#0F172A] rounded-full p-3 flex items-center justify-center shadow-md">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
              </span>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">Step 5: Anyone Can Verify It</h3>
                <p className="text-[#F1F5F9]">Users can input an image ID on the ZorAi platform to check whether it has been registered, when it was created, and which model generated it — all from a trustless, decentralized source.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4 text-[#00F5D4]">Ready to get started?</h2>
          <p className="text-[#F1F5F9] mb-6">Connect your wallet and register your first AI-generated image, or verify an existing one on the blockchain.</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link href="/connect">
              <button className="bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-[#0F172A] px-8 py-3 rounded-xl font-bold text-lg hover:scale-105 hover:shadow-xl transition-all duration-200">Connect Wallet</button>
            </Link>
            <Link href="/submit">
              <button className="bg-[#1E293B] border border-[#00F5D4] text-[#00F5D4] px-8 py-3 rounded-xl font-bold text-lg hover:bg-[#00F5D4]/10 hover:scale-105 hover:shadow-xl transition-all duration-200">Register Image</button>
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
} 