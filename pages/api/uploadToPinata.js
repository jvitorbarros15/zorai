import axios from 'axios';
import FormData from 'form-data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Missing imageUrl' });
  }

  try {
    // Fetch the image as a buffer
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(imageResponse.data);

    // Create FormData for Pinata
    const formData = new FormData();
    formData.append('file', buffer, 'image.png');

    // Send to Pinata
    const pinataRes = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          ...formData.getHeaders()
        }
      }
    );

    // Add logging for debugging
    console.log('Pinata API response:', pinataRes.data);
    const cid = pinataRes.data.IpfsHash;
    console.log('Returned CID:', cid);

    return res.status(200).json({
      success: true,
      cid,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${cid}`
    });
  } catch (error) {
    // Enhanced error logging
    console.error('Pinata upload error:', error.response?.data || error.message, error);
    return res.status(500).json({
      error: 'Failed to upload to Pinata',
      details: error.response?.data || error.message
    });
  }
} 