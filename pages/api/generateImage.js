import OpenAI from 'openai';
import { ethers } from 'ethers';
import { useWallet } from '../../contexts/WalletContext';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Mock contract for now - replace with actual contract
const contractABI = [
  "function registerRiskyImage(string memory imageId, string memory prompt, string memory ipfsHash) public"
];

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Attempting to generate image for prompt:', prompt);

    try {
      // Generate the image first
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "vivid"
      });

      console.log('Image generation response:', imageResponse);

      if (!imageResponse.data || imageResponse.data.length === 0) {
        throw new Error('No image data received from OpenAI');
      }

      // Create basic image data
      const imageData = {
        id: Date.now().toString(),
        prompt: prompt,
        imageUrl: imageResponse.data[0].url,
        timestamp: new Date().toISOString(),
        modelUsed: 'dall-e-3',
        isRisky: false,
        riskLevel: "low",
        reasons: []
      };

      // Try to analyze the prompt for risks
      try {
        const analysisPrompt = `Analyze this image generation prompt for potential risks:
        - Could this image influence people's opinions or beliefs?
        - Could it cause harm or negative consequences?
        - Does it go against democratic principles?
        - Could it be used for misinformation or manipulation?
        
        Prompt: "${prompt}"
        
        Respond with a JSON object containing:
        {
          "isRisky": boolean,
          "riskLevel": "low" | "medium" | "high",
          "reasons": string[],
          "suggestions": string[]
        }`;

        const analysisResponse = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are an AI safety analyst. Analyze image prompts for potential risks and provide detailed feedback."
            },
            {
              role: "user",
              content: analysisPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        });

        try {
          const analysis = JSON.parse(analysisResponse.choices[0].message.content);
          imageData.isRisky = analysis.isRisky;
          imageData.riskLevel = analysis.riskLevel;
          imageData.reasons = analysis.reasons;
        } catch (parseError) {
          console.error('Error parsing analysis response:', parseError);
          // Continue with default values if analysis fails
        }
      } catch (analysisError) {
        console.error('Error during prompt analysis:', analysisError);
        // Continue with the image even if analysis fails
      }

      // If the image is risky, store it on the blockchain
      if (imageData.isRisky) {
        try {
          // Mock blockchain interaction for now
          // In production, you would:
          // 1. Upload image to IPFS
          // 2. Get IPFS hash
          // 3. Call smart contract to register the image
          const mockIpfsHash = `ipfs_${Date.now()}`;
          
          // Mock contract interaction
          console.log(`Registering risky image on blockchain:
            ID: ${imageData.id}
            Prompt: ${prompt}
            IPFS Hash: ${mockIpfsHash}
            Risk Level: ${imageData.riskLevel}
            Reasons: ${imageData.reasons.join(', ')}
          `);

          // In production, you would use:
          // const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
          // const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, provider);
          // await contract.registerRiskyImage(imageData.id, prompt, mockIpfsHash);
        } catch (error) {
          console.error('Error storing image on blockchain:', error);
          // Continue with the response even if blockchain storage fails
        }
      }

      return res.status(200).json({
        success: true,
        data: imageData
      });
    } catch (openaiError) {
      console.error('OpenAI API Error:', openaiError);
      return res.status(400).json({
        error: 'OpenAI API Error',
        message: openaiError.message || 'Failed to generate image',
        details: process.env.NODE_ENV === 'development' ? openaiError : undefined
      });
    }
  } catch (error) {
    console.error('General Error:', error);
    return res.status(500).json({
      error: 'Server Error',
      message: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
} 