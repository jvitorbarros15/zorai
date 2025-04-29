export default function handler(req, res) {
  // Only return public variables for security
  res.status(200).json({
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'Not set',
    imageSize: process.env.NEXT_PUBLIC_MAX_IMAGE_SIZE || 'Not set',
    imageModel: process.env.NEXT_PUBLIC_DEFAULT_IMAGE_MODEL || 'Not set',
    // Don't expose the actual API key, just check if it exists
    hasOpenAiKey: !!process.env.OPENAI_API_KEY
  });
} 