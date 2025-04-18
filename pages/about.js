import Layout from '../components/layout/Layout';

export default function About() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* What is ZorAi Section */}
        <section className="mb-12">
          <h1 className="text-3xl font-bold mb-6 text-[#00F5D4]">What is ZorAi?</h1>
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
          <h2 className="text-2xl font-bold mb-8 text-[#00F5D4]">How It Works</h2>
          <div className="space-y-8">
            <div className="bg-[#1E293B] p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-white">Step 1: Image Is Created by AI</h3>
              <p className="text-[#F1F5F9]">
                An image is generated using an AI tool (e.g., DALL·E, Midjourney, etc.), either directly through ZorAi or another platform.
              </p>
            </div>

            <div className="bg-[#1E293B] p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-white">Step 2: A Unique Image ID Is Generated</h3>
              <p className="text-[#F1F5F9]">
                ZorAi automatically (or manually) generates a unique ID using a secure hashing algorithm. This ID is derived from factors like the prompt, timestamp, and AI model used — making it a reliable fingerprint of the image&apos;s origin.
              </p>
            </div>

            <div className="bg-[#1E293B] p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-white">Step 3: Content Risk Filter (Optional)</h3>
              <p className="text-[#F1F5F9]">
                Before registering the ID, ZorAi can run the prompt or image through a risk filter (e.g., via OpenAI moderation API or image classifiers) to detect potential for misinformation or sensitive content.
              </p>
              <p className="text-[#F1F5F9] mt-3">
                Only images with potential impact (e.g., impersonation, political content, news-related visuals) may be logged on-chain.
              </p>
            </div>

            <div className="bg-[#1E293B] p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-white">Step 4: ID Is Registered on the Blockchain</h3>
              <p className="text-[#F1F5F9]">
                If the image passes the filter, its unique ID is stored on the blockchain via a smart contract. This ensures:
              </p>
              <ul className="list-disc list-inside mt-3 text-[#F1F5F9] space-y-1 ml-4">
                <li>Permanent record</li>
                <li>Public visibility</li>
                <li>Proof of provenance</li>
              </ul>
            </div>

            <div className="bg-[#1E293B] p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-white">Step 5: Anyone Can Verify It</h3>
              <p className="text-[#F1F5F9]">
                Users can input an image ID on the ZorAi platform to check whether it has been registered, when it was created, and which model generated it — all from a trustless, decentralized source.
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
} 