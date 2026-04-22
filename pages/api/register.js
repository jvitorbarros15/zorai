import {
  buildMetadataTemplate,
  buildWatermark,
  fetchRegistrationEvent,
  getContractAddress,
  getWriteContract,
  hashStructuredPayload,
  ZORAI_CHAIN_ID,
  ZORAI_CHAIN_SLUG,
} from '../../lib/zoraiRegistry';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.ZORAI_API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }

  const {
    imageHash,
    modelUsed,
    ipfsHash,
    riskLevel = 0,
    riskReasons = [],
    company,
    externalId,
    sourceUrl,
    contentType = 'image',
  } = req.body;

  if (!imageHash || !modelUsed || !ipfsHash) {
    return res.status(400).json({
      error: 'Missing required fields: imageHash, modelUsed, ipfsHash',
    });
  }

  if (!Array.isArray(riskReasons)) {
    return res.status(400).json({
      error: 'riskReasons must be an array of strings',
    });
  }

  if (!process.env.ZORAI_SIGNER_PRIVATE_KEY) {
    return res.status(503).json({ error: 'Signer not configured' });
  }

  if (!getContractAddress()) {
    return res.status(503).json({ error: 'Contract address not configured' });
  }

  try {
    const contract = getWriteContract();

    const tx = await contract.registerImage(
      imageHash,
      modelUsed,
      ipfsHash,
      riskLevel,
      riskReasons
    );
    const receipt = await tx.wait();
    const block = await contract.runner.provider.getBlock(receipt.blockNumber);
    const registeredAt = new Date(Number(block.timestamp) * 1000).toISOString();
    const eventInfo =
      (await fetchRegistrationEvent(contract, imageHash)) || {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    const watermark = buildWatermark({
      imageHash,
      modelUsed,
      registeredAt,
      txHash: eventInfo.txHash,
      blockNumber: eventInfo.blockNumber,
    });
    const watermarkHash = hashStructuredPayload(watermark);
    const metadataTemplate = buildMetadataTemplate({
      watermark,
      watermarkHash,
      company,
      externalId,
      sourceUrl,
      contentType,
    });

    return res.status(200).json({
      success: true,
      imageId: imageHash,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      chain: ZORAI_CHAIN_SLUG,
      chainId: ZORAI_CHAIN_ID,
      contract: getContractAddress(),
      watermark,
      watermarkHash,
      metadataTemplate,
      registryRecord: {
        imageId: imageHash,
        modelUsed,
        ipfsHash,
        riskLevel,
        riskReasons,
        publisher: company || null,
        externalId: externalId || null,
        sourceUrl: sourceUrl || null,
        contentType,
      },
    });
  } catch (err) {
    console.error('[register] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
