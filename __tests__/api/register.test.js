import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/register';

const CONTRACT = '0xdeadbeef';
const VALID_BODY = {
  imageHash: 'abc123',
  modelUsed: 'DALL-E',
  ipfsHash: 'Qm456',
};

const mockWatermark = { version: '1.0', imageHash: 'abc123' };
const mockWatermarkHash = 'wh123';

const mockTx = {
  wait: jest.fn(async () => ({
    hash: '0xtxhash',
    blockNumber: 42,
  })),
};

const mockProvider = { getBlock: jest.fn(async () => ({ timestamp: 1700000000 })) };

const mockContract = {
  registerImage: jest.fn(async () => mockTx),
  runner: { provider: mockProvider },
};

jest.mock('../../lib/zoraiRegistry', () => ({
  getContractAddress: jest.fn(),
  getWriteContract: jest.fn(),
  fetchRegistrationEvent: jest.fn(),
  buildWatermark: jest.fn(),
  buildMetadataTemplate: jest.fn(),
  hashStructuredPayload: jest.fn(),
  ZORAI_CHAIN_ID: 84532,
  ZORAI_CHAIN_SLUG: 'base-sepolia',
}));

const {
  getContractAddress,
  getWriteContract,
  fetchRegistrationEvent,
  buildWatermark,
  buildMetadataTemplate,
  hashStructuredPayload,
} = require('../../lib/zoraiRegistry');

function mockChainOk() {
  process.env.ZORAI_SIGNER_PRIVATE_KEY = '0xkey';
  process.env.ZORAI_API_KEY = 'test-key';
  getContractAddress.mockReturnValue(CONTRACT);
  getWriteContract.mockReturnValue(mockContract);
  fetchRegistrationEvent.mockResolvedValue({ txHash: '0xtxhash', blockNumber: 42 });
  buildWatermark.mockReturnValue(mockWatermark);
  hashStructuredPayload.mockReturnValue(mockWatermarkHash);
  buildMetadataTemplate.mockReturnValue({ aiGenerated: true });
}

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.ZORAI_SIGNER_PRIVATE_KEY;
  delete process.env.ZORAI_API_KEY;
});

describe('POST /api/register', () => {
  test('405 for non-POST', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  test('401 when API key missing', async () => {
    const { req, res } = createMocks({ method: 'POST', body: VALID_BODY });
    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  test('401 when API key wrong', async () => {
    process.env.ZORAI_API_KEY = 'correct-key';
    const { req, res } = createMocks({
      method: 'POST',
      headers: { 'x-api-key': 'wrong-key' },
      body: VALID_BODY,
    });
    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  test('400 when required fields missing', async () => {
    process.env.ZORAI_API_KEY = 'test-key';
    const { req, res } = createMocks({
      method: 'POST',
      headers: { 'x-api-key': 'test-key' },
      body: { imageHash: 'abc123' },
    });
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().error).toMatch(/modelUsed/);
  });

  test('400 when riskReasons not array', async () => {
    process.env.ZORAI_API_KEY = 'test-key';
    const { req, res } = createMocks({
      method: 'POST',
      headers: { 'x-api-key': 'test-key' },
      body: { ...VALID_BODY, riskReasons: 'bad' },
    });
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().error).toMatch(/riskReasons/);
  });

  test('503 when signer not configured', async () => {
    process.env.ZORAI_API_KEY = 'test-key';
    getContractAddress.mockReturnValue(CONTRACT);
    const { req, res } = createMocks({
      method: 'POST',
      headers: { 'x-api-key': 'test-key' },
      body: VALID_BODY,
    });
    await handler(req, res);
    expect(res.statusCode).toBe(503);
  });

  test('200 happy path returns watermark and metadata', async () => {
    mockChainOk();
    const { req, res } = createMocks({
      method: 'POST',
      headers: { 'x-api-key': 'test-key' },
      body: VALID_BODY,
    });
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const body = res._getJSONData();
    expect(body.success).toBe(true);
    expect(body.watermark).toEqual(mockWatermark);
    expect(body.watermarkHash).toBe(mockWatermarkHash);
    expect(body.txHash).toBe('0xtxhash');
  });
});
