import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Path to the chat history file
const chatHistoryPath = path.join(process.cwd(), 'data', 'chatHistory.json');

// Ensure the data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'));
}

// Initialize chat history file if it doesn't exist
if (!fs.existsSync(chatHistoryPath)) {
  fs.writeFileSync(chatHistoryPath, JSON.stringify([]));
}

// Helper function to read chat history
function readChatHistory() {
  try {
    const data = fs.readFileSync(chatHistoryPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading chat history:', error);
    return [];
  }
}

// Helper function to write chat history
function writeChatHistory(history) {
  try {
    fs.writeFileSync(chatHistoryPath, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Error writing chat history:', error);
    throw error;
  }
}

// Generate secure image ID using SHA256
function generateSecureImageId(prompt, timestamp, creator) {
  const data = `${prompt}-${timestamp}-${creator}`;
  return CryptoJS.SHA256(data).toString();
}

// Mock IPFS upload - store locally
async function mockIPFSUpload(imageData) {
  try {
    const mockIpfsHash = CryptoJS.SHA256(JSON.stringify(imageData)).toString().substring(0, 46);
    return mockIpfsHash;
  } catch (error) {
    console.error('Mock IPFS Upload Error:', error);
    throw new Error('Failed to store data locally');
  }
}

// Mock blockchain registration - store locally
async function mockBlockchainRegistration(imageId, ipfsHash, modelUsed) {
  try {
    const mockTxHash = CryptoJS.SHA256(imageId + ipfsHash).toString().substring(0, 66);
    return mockTxHash;
  } catch (error) {
    console.error('Mock Blockchain Registration Error:', error);
    throw new Error('Failed to store data locally');
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Handle POST request for new chat
    if (req.method === 'POST') {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that provides information about AI-generated images and their verification."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 1000
        });

        const response = completion.choices[0].message.content;

        // Create new chat entry
        const chat = {
          id: Date.now().toString(),
          prompt,
          response,
          timestamp: new Date().toISOString()
        };

        // Read existing chats and add new one
        const existingChats = readChatHistory();
        existingChats.push(chat);
        writeChatHistory(existingChats);

        return res.status(200).json({
          success: true,
          data: chat
        });
      } catch (error) {
        console.error('OpenAI API Error:', error);
        return res.status(500).json({
          error: error.message || 'Failed to generate response',
          type: 'OpenAI_Error'
        });
      }
    }

    // Handle GET request for fetching chat history
    if (req.method === 'GET') {
      const chats = readChatHistory();
      
      return res.status(200).json({
        success: true,
        data: chats,
        metadata: {
          total: chats.length,
          limit: 10,
          offset: 0
        }
      });
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
} 