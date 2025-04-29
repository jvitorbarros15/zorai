import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';

export default function TestAPI() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [mode, setMode] = useState('chat'); // 'chat' or 'image'

  // Fetch chat history on component mount
  useEffect(() => {
    if (mode === 'chat') {
      fetchChatHistory();
    }
  }, [mode]);

  // Generate new chat response or image
  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const endpoint = mode === 'chat' ? '/api/fetchChatHistory' : '/api/generateImage';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${mode === 'chat' ? 'generate chat' : 'generate image'}`);
      }

      setResult(data.data);
      if (mode === 'chat') {
        fetchChatHistory();
      }
      // Clear the input field after successful submission
      setPrompt('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch chat history
  const fetchChatHistory = async () => {
    try {
      const response = await fetch('/api/fetchChatHistory');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch chat history');
      }

      setChatHistory(data.data);
    } catch (err) {
      console.error('Error fetching chat history:', err);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-transparent bg-clip-text">
          API Test Page
        </h1>

        {/* Mode Selection */}
        <div className="mb-6 flex justify-center gap-4">
          <button
            onClick={() => setMode('chat')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              mode === 'chat'
                ? 'bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-[#0F172A]'
                : 'bg-[#334155] text-white hover:bg-[#475569]'
            }`}
          >
            Chat Mode
          </button>
          <button
            onClick={() => setMode('image')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              mode === 'image'
                ? 'bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-[#0F172A]'
                : 'bg-[#334155] text-white hover:bg-[#475569]'
            }`}
          >
            Image Mode
          </button>
        </div>

        {/* Input Form */}
        <div className="mb-12 bg-[#1E293B] p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-white">
            {mode === 'chat' ? 'New Chat' : 'Generate Image'}
          </h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#94A3B8]">
                {mode === 'chat' ? 'Your Question' : 'Image Prompt'}
              </label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full px-4 py-2 bg-[#0F172A] border border-[#334155] rounded-lg focus:outline-none focus:border-[#00F5D4] text-white"
                placeholder={mode === 'chat' ? 'Ask about AI image verification...' : 'Describe the image you want to generate...'}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r from-[#00F5D4] to-[#00D4F5] text-[#0F172A] px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-all duration-200 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Generating...' : mode === 'chat' ? 'Send Message' : 'Generate Image'}
            </button>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-500">
                {error.includes('Content policy violation') ? (
                  <>
                    <span className="font-semibold">⚠️ Content Policy Violation</span>
                    <br />
                    This prompt contains content that violates our content policy. Please try a different prompt.
                    <br />
                    <span className="text-sm text-red-400 mt-2 block">
                      Tips for better prompts:
                      <ul className="list-disc list-inside mt-1 ml-4">
                        <li>Avoid offensive or inappropriate content</li>
                        <li>Focus on positive and constructive imagery</li>
                        <li>Be creative while staying within community guidelines</li>
                      </ul>
                    </span>
                  </>
                ) : (
                  error
                )}
              </p>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="mt-6 p-4 bg-[#0F172A] rounded-lg">
              <h3 className="text-lg font-medium mb-3 text-[#00F5D4]">
                {mode === 'chat' ? 'Response' : 'Generated Image'}
              </h3>
              <div className="space-y-2">
                {mode === 'chat' ? (
                  <>
                    <p className="text-sm text-[#94A3B8]">
                      <strong>Question:</strong> {result.prompt}
                    </p>
                    <p className="text-sm text-[#94A3B8]">
                      <strong>Response:</strong> {result.response}
                    </p>
                    <p className="text-sm text-[#94A3B8]">
                      <strong>Time:</strong> {new Date(result.timestamp).toLocaleString()}
                    </p>
                  </>
                ) : (
                  <>
                    <img
                      src={result.imageUrl}
                      alt={result.prompt}
                      className="w-full h-auto rounded-lg"
                    />
                    <p className="text-sm text-[#94A3B8]">
                      <strong>Prompt:</strong> {result.prompt}
                    </p>
                    <p className="text-sm text-[#94A3B8]">
                      <strong>Generated with:</strong> {result.modelUsed}
                    </p>
                    <p className="text-sm text-[#94A3B8]">
                      <strong>Time:</strong> {new Date(result.timestamp).toLocaleString()}
                    </p>
                    {result.isRisky && (
                      <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <h4 className="text-lg font-semibold text-red-500 mb-2">⚠️ Risk Analysis</h4>
                        <p className="text-sm text-red-400 mb-2">
                          <strong>Risk Level:</strong> {result.riskLevel.toUpperCase()}
                        </p>
                        <div className="space-y-2">
                          <p className="text-sm text-red-400">
                            <strong>Potential Risks:</strong>
                          </p>
                          <ul className="list-disc list-inside text-sm text-red-400 ml-4">
                            {result.reasons.map((reason, index) => (
                              <li key={index}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-sm text-red-400 mt-2">
                          This image has been registered on the blockchain for transparency and accountability.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chat History (only shown in chat mode) */}
        {mode === 'chat' && (
          <div className="bg-[#1E293B] p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Chat History</h2>
              <button
                onClick={fetchChatHistory}
                className="px-4 py-2 bg-[#334155] text-white rounded-lg hover:bg-[#475569] transition-all duration-200"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-4">
              {chatHistory.map((chat) => (
                <div key={chat.id} className="p-4 bg-[#0F172A] rounded-lg">
                  <p className="text-sm text-[#94A3B8] mb-1">
                    <strong>Question:</strong> {chat.prompt}
                  </p>
                  <p className="text-sm text-[#94A3B8] mb-1">
                    <strong>Response:</strong> {chat.response}
                  </p>
                  <p className="text-sm text-[#94A3B8]">
                    <strong>Time:</strong> {new Date(chat.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 