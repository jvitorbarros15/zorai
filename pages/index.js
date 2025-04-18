import { useState } from 'react';
import Image from 'next/image';
import Layout from '../components/layout/Layout';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [images] = useState([
    { id: 'ai_123456', model: 'DALL-E', date: '2024-04-18', status: 'Verified' },
    { id: 'ai_789012', model: 'Midjourney', date: '2024-04-17', status: 'Verified' },
    { id: 'ai_345678', model: 'Stable Diffusion', date: '2024-04-16', status: 'Pending' },
  ]);

  const filteredImages = images.filter(image =>
    image.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-transparent bg-clip-text">
            Verify AI-Generated Images
          </h1>
          <p className="text-xl text-[#94A3B8] max-w-2xl mx-auto">
            Secure and transparent verification of AI-generated content on the blockchain
          </p>
        </div>

        {/* Search Section */}
        <div className="mb-12">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Image src="/icons/search.svg" alt="Search" width={20} height={20} className="text-[#94A3B8]" />
            </div>
            <input
              type="text"
              placeholder="Search by Image ID or AI Model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#1E293B] border border-[#334155] rounded-xl focus:outline-none focus:border-[#00F5D4] text-[#F1F5F9] placeholder-[#94A3B8]"
            />
          </div>
        </div>

        {/* Image List */}
        <div className="grid gap-4">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="bg-[#1E293B] p-6 rounded-xl border border-[#334155] hover:border-[#00F5D4] transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-[#00F5D4]">{image.id}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      image.status === 'Verified' 
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {image.status}
                    </span>
                  </div>
                  <p className="text-[#94A3B8]">Generated with {image.model}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-[#94A3B8]">{image.date}</span>
                  <Image
                    src="/icons/verify.svg"
                    alt="Verify"
                    width={24}
                    height={24}
                    className="text-[#00F5D4]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <button className="bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-[#0F172A] px-6 py-2.5 rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2 group inline-flex">
            <span>Register New Image</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 transform group-hover:rotate-90 transition-transform duration-200" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </Layout>
  );
} 