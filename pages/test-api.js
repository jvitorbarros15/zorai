import { useState } from 'react';
import Layout from '../components/layout/Layout';

export default function TestAPI() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setImageUrl('');
    setAnalysis(null);

    try {
      const response = await fetch('/api/generateImage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setImageUrl(data.data.imageUrl);
      setAnalysis(data.data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-transparent bg-clip-text text-center">Test Image Generation API</h1>
        
        <div className="bg-[#1E293B] rounded-lg p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium mb-2">
                Enter your image prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full px-4 py-2 bg-[#0F172A] border border-[#334155] rounded-lg focus:outline-none focus:border-[#00F5D4] text-[#F1F5F9] min-h-[100px]"
                placeholder="Describe the image you want to generate..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-[#0F172A] px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <span>Generating...</span>
              ) : (
                <>
                  <span>Generate Image</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {imageUrl && (
            <div className="mt-6 space-y-4">
              <div className="relative w-full aspect-square">
                <img 
                  src={imageUrl} 
                  alt="Generated" 
                  className="w-full h-full object-contain rounded-lg border border-[#334155]"
                />
              </div>

              {analysis && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#0F172A] rounded-lg border border-[#334155]">
                    <h3 className="text-lg font-semibold mb-2 text-[#00F5D4]">Analysis Results</h3>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="text-[#94A3B8]">Risk Level:</span>{' '}
                        <span className={`font-medium ${
                          analysis.riskLevel === 'high' ? 'text-red-400' :
                          analysis.riskLevel === 'medium' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {analysis.riskLevel.toUpperCase()}
                        </span>
                      </p>
                      {analysis.reasons.length > 0 && (
                        <div>
                          <p className="text-sm text-[#94A3B8] mb-1">Reasons:</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {analysis.reasons.map((reason, index) => (
                              <li key={index} className="text-[#F1F5F9]">{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 