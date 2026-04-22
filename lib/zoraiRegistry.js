import crypto from 'crypto';
import { ethers } from 'ethers';
import ZorAiRegistry from '../contracts/ZorAiRegistry.json';

export const ZORAI_RPC_URL = process.env.ZORAI_RPC_URL || 'https://sepolia.base.org';
export const ZORAI_CHAIN_ID = 84532;
export const ZORAI_CHAIN_SLUG = 'base-sepolia';
export const RISK_LABELS = ['low', 'medium', 'high'];

function stableSort(value) {
  if (Array.isArray(value)) {
    return value.map(stableSort);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = stableSort(value[key]);
        return acc;
      }, {});
  }

  return value;
}

export function hashStructuredPayload(payload) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(stableSort(payload)))
    .digest('hex');
}

export function getContractAddress() {
  return process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
}

export function getReadProvider() {
  return new ethers.JsonRpcProvider(ZORAI_RPC_URL, ZORAI_CHAIN_ID);
}

export function getReadContract() {
  const contractAddress = getContractAddress();
  return new ethers.Contract(contractAddress, ZorAiRegistry.abi, getReadProvider());
}

export function getWriteContract() {
  const provider = getReadProvider();
  const signer = new ethers.Wallet(process.env.ZORAI_SIGNER_PRIVATE_KEY, provider);
  const contractAddress = getContractAddress();
  return new ethers.Contract(contractAddress, ZorAiRegistry.abi, signer);
}

export async function fetchImageRecord(contract, imageHash) {
  const data = await contract.getImageData(imageHash);

  return {
    imageId: imageHash,
    ipfsHash: data[0],
    modelUsed: data[1],
    creator: data[2],
    registeredAt: new Date(Number(data[3]) * 1000).toISOString(),
    isVerified: data[4],
    riskLevel: RISK_LABELS[Number(data[5])] ?? 'unknown',
    riskReasons: data[6],
  };
}

export async function fetchRegistrationEvent(contract, imageHash) {
  const filter = contract.filters.ImageRegistered(imageHash);
  const events = await contract.queryFilter(filter);

  if (!events.length) {
    return null;
  }

  const latestEvent = events[events.length - 1];

  return {
    txHash: latestEvent.transactionHash,
    blockNumber: latestEvent.blockNumber,
  };
}

export function buildWatermark({ imageHash, modelUsed, registeredAt, txHash, blockNumber }) {
  const contractAddress = getContractAddress();

  return {
    version: '1.0',
    zorai: true,
    imageHash,
    model: modelUsed,
    registeredAt,
    chain: ZORAI_CHAIN_SLUG,
    chainId: ZORAI_CHAIN_ID,
    contract: contractAddress,
    txHash: txHash || null,
    blockNumber: typeof blockNumber === 'number' ? blockNumber : null,
  };
}

export function buildMetadataTemplate({
  watermark,
  watermarkHash,
  company,
  externalId,
  sourceUrl,
  contentType,
}) {
  return {
    aiGenerated: true,
    zorai: {
      watermark,
      watermarkHash,
      publisher: company || null,
      externalId: externalId || null,
      sourceUrl: sourceUrl || null,
      contentType: contentType || 'image',
    },
    xmpFields: {
      'XMP:ZorAI': JSON.stringify(watermark),
      'XMP:ZorAIHash': watermarkHash,
      'XMP:AIGenerated': 'true',
      'XMP:ZorAIModel': watermark.model,
      'XMP:ZorAIImageHash': watermark.imageHash,
      'XMP:ZorAIPublisher': company || '',
    },
  };
}
