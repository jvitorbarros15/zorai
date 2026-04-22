import {
  buildWatermark,
  fetchImageRecord,
  fetchRegistrationEvent,
  getContractAddress,
  getReadContract,
  getReadProvider,
  hashStructuredPayload,
  ZORAI_CHAIN_ID,
  ZORAI_CHAIN_SLUG,
} from '../../lib/zoraiRegistry';

function getRequestPayload(req) {
  if (req.method === 'GET') {
    return {
      imageHash: req.query.id,
      watermarkHash: req.query.watermarkHash,
    };
  }

  return req.body || {};
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageHash, watermark, watermarkHash } = getRequestPayload(req);
  if (!imageHash) {
    return res.status(400).json({
      error: req.method === 'GET'
        ? 'Missing required query param: id (SHA-256 image hash)'
        : 'Missing required field: imageHash',
    });
  }

  if (!getContractAddress()) {
    return res.status(503).json({ error: 'Contract address not configured' });
  }

  try {
    const provider = getReadProvider();
    const contractAddress = getContractAddress();

    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      return res.status(503).json({ error: 'Contract not deployed on Base Sepolia' });
    }

    const contract = getReadContract();
    const record = await fetchImageRecord(contract, imageHash);
    const eventInfo = await fetchRegistrationEvent(contract, imageHash);
    const onChainWatermark = buildWatermark({
      imageHash,
      modelUsed: record.modelUsed,
      registeredAt: record.registeredAt,
      txHash: eventInfo?.txHash,
      blockNumber: eventInfo?.blockNumber,
    });
    const onChainWatermarkHash = hashStructuredPayload(onChainWatermark);
    const suppliedWatermarkHash = watermarkHash || (watermark ? hashStructuredPayload(watermark) : null);
    const watermarkMatches = suppliedWatermarkHash ? suppliedWatermarkHash === onChainWatermarkHash : null;

    return res.status(200).json({
      isAiGenerated: true,
      found: true,
      imageId: imageHash,
      ipfsHash: record.ipfsHash,
      modelUsed: record.modelUsed,
      creator: record.creator,
      registeredAt: record.registeredAt,
      isVerified: record.isVerified,
      riskLevel: record.riskLevel,
      riskReasons: record.riskReasons,
      chain: ZORAI_CHAIN_SLUG,
      chainId: ZORAI_CHAIN_ID,
      contract: contractAddress,
      watermark: {
        onChain: onChainWatermark,
        onChainHash: onChainWatermarkHash,
        suppliedHash: suppliedWatermarkHash,
        matchesBlockchain: watermarkMatches,
      },
    });
  } catch (err) {
    if (err.code === 'CALL_EXCEPTION') {
      return res.status(404).json({
        isAiGenerated: false,
        found: false,
        message: 'Image not found in ZorAI registry',
      });
    }
    console.error('[verify] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
