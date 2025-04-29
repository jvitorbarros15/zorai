import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

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

    const response = await openai.chat.completions.create({
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

    const analysis = JSON.parse(response.choices[0].message.content);

    return res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing prompt:', error);
    return res.status(500).json({
      error: 'Failed to analyze prompt',
      message: error.message
    });
  }
} 