import { useState } from 'react';
import Layout from '../components/layout/Layout';

export default function Submit() {
  const [formData, setFormData] = useState({
    imageId: '',
    model: '',
    autoDetect: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement blockchain integration
    console.log('Form submitted:', formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Submit New Image</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image ID Input */}
          <div>
            <label htmlFor="imageId" className="block text-sm font-medium mb-2">
              Image ID
            </label>
            <input
              type="text"
              id="imageId"
              name="imageId"
              value={formData.imageId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-[#1E293B] border border-[#334155] rounded-lg focus:outline-none focus:border-[#00F5D4] text-[#F1F5F9]"
              placeholder="Enter image ID"
            />
          </div>

          {/* AI Model Selection */}
          <div>
            <label htmlFor="model" className="block text-sm font-medium mb-2">
              AI Model
            </label>
            <select
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-[#1E293B] border border-[#334155] rounded-lg focus:outline-none focus:border-[#00F5D4] text-[#F1F5F9]"
            >
              <option value="">Select a model</option>
              <option value="DALL-E">DALL-E</option>
              <option value="Midjourney">Midjourney</option>
              <option value="Stable Diffusion">Stable Diffusion</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Auto Detect Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoDetect"
              name="autoDetect"
              checked={formData.autoDetect}
              onChange={handleChange}
              className="h-4 w-4 text-[#00F5D4] focus:ring-[#00F5D4] border-[#334155] rounded"
            />
            <label htmlFor="autoDetect" className="ml-2 block text-sm">
              Enable automatic model detection
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full px-6 py-3 bg-[#00F5D4] text-[#0F172A] font-semibold rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Register Image
            </button>
          </div>
        </form>

        {/* Note about MetaMask */}
        <div className="mt-8 p-4 bg-[#1E293B] rounded-lg border border-[#334155]">
          <p className="text-sm text-[#94A3B8]">
            Note: You will need to connect your MetaMask wallet to register the image on the blockchain.
          </p>
        </div>
      </div>
    </Layout>
  );
} 