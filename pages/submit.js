import { useState } from 'react';
import Layout from '../components/layout/Layout';

export default function Submit() {
  const [formData, setFormData] = useState({
    imageId: '',
    model: '',
    autoDetect: false,
    image: null,
    imagePreview: null,
    fullSizePreview: null
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create a full size preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Store full size preview
        setFormData(prev => ({
          ...prev,
          fullSizePreview: e.target.result
        }));

        // Create small version for storage (32x32 pixels)
        const storageCanvas = document.createElement('canvas');
        storageCanvas.width = 32;
        storageCanvas.height = 32;
        const storageCtx = storageCanvas.getContext('2d');
        storageCtx.drawImage(img, 0, 0, 32, 32);
        const smallImageData = storageCanvas.toDataURL('image/jpeg', 0.1);

        setFormData(prev => ({
          ...prev,
          image: smallImageData,
          imagePreview: smallImageData
        }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement blockchain integration
    console.log('Form submitted:', formData);
    
    // Store the data in localStorage for now (prototype)
    const images = JSON.parse(localStorage.getItem('registeredImages') || '[]');
    const newImage = {
      id: formData.imageId,
      model: formData.model,
      date: new Date().toISOString().split('T')[0],
      status: 'Verified',
      imageData: formData.image
    };
    images.push(newImage);
    localStorage.setItem('registeredImages', JSON.stringify(images));
    
    // Redirect to home page
    window.location.href = '/';
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
          {/* Image Upload and Preview */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium mb-2">
              Upload Image
            </label>
            <div className="flex flex-col gap-4">
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-[#94A3B8] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#00F5D4] file:text-[#0F172A] hover:file:bg-[#00D4F5]"
              />
              
              {/* Tiny Preview */}
              {formData.fullSizePreview && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Preview</h3>
                  <div className="relative w-[300px] h-[300px] mx-auto">
                    <img 
                      src={formData.fullSizePreview} 
                      alt="Preview" 
                      className="w-full h-full object-contain rounded-lg border border-[#334155]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

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
          <div className="pt-4 flex justify-center">
            <button
              type="submit"
              className="w-48 bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-[#0F172A] px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              <span>Register Image</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 transform group-hover:rotate-90 transition-transform duration-200" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </form>

        {/* Note about MetaMask */}
        <div className="mt-4">
          <p className="text-sm text-[#94A3B8]">
            Note: You will need to connect your MetaMask wallet to register the image on the blockchain.
          </p>
        </div>
      </div>
    </Layout>
  );
} 