import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/verify';

const CONTRACT = '0xdeadbeef';
const IMAGE_HASH = 'abc123';

const mockRecord = {
  ipfsHash: 'Qm123',
  modelUsed: 'DALL-E',
  creator: '0xissuer',
  registeredAt: '2024-01-01T00:00:00.000Z',
  isVerified: true,
  riskLevel: 'low',
  riskReasons: [],
};

const mockWatermark = { version: '1.0', imageHash: IMAGE_HASH };
const mockWatermarkHash = 'wh123';

jest.mock('../../lib/zoraiRegistry', () => ({
  getContractAddress: jest.fn(),
  getReadProvider: jest.fn(),
  getReadContract: jest.fn(),
  fetchImageRecord: jest.fn(),
  fetchRegistrationEvent: jest.fn(),
  buildWatermark: jest.fn(),
  hashStructuredPayload: jest.fn(),
  ZORAI_CHAIN_ID: 84532,
  ZORAI_CHAIN_SLUG: 'base-sepolia',
}));

const {
  getContractAddress,
  getReadProvider,
  getReadContract,
  fetchImageRecord,
  fetchRegistrationEvent,
  buildWatermark,
  hashStructuredPayload,
} = require('../../lib/zoraiRegistry');

function mockChainOk() {
  getContractAddress.mockReturnValue(CONTRACT);
  getReadProvider.mockReturnValue({ getCode: jest.fn(async () => '0x1234') });
  getReadContract.mockReturnValue({});
  fetchImageRecord.mockResolvedValue(mockRecord);
  fetchRegistrationEvent.mockResolvedValue({ txHash: '0xtx', blockNumber: 1 });
  buildWatermark.mockReturnValue(mockWatermark);
  hashStructuredPayload.mockReturnValue(mockWatermarkHash);
}

beforeEach(() => jest.clearAllMocks());

describe('GET /api/verify', () => {
  test('400 when id param missing', async () => {
    const { req, res } = createMocks({ method: 'GET', query: {} });
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('503 when contract address not configured', async () => {
    getContractAddress.mockReturnValue(null);
    const { req, res } = createMocks({ method: 'GET', query: { id: IMAGE_HASH } });
    await handler(req, res);
    expect(res.statusCode).toBe(503);
  });

  test('200 with honest found message when record exists', async () => {
    mockChainOk();
    const { req, res } = createMocks({ method: 'GET', query: { id: IMAGE_HASH } });
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const body = res._getJSONData();
    expect(body.found).toBe(true);
    expect(body.message).toMatch(/AI-generated, attested by/);
    expect(body.message).toContain(mockRecord.creator);
  });

  test('404 with honest not-found message when record missing', async () => {
    getContractAddress.mockReturnValue(CONTRACT);
    getReadProvider.mockReturnValue({ getCode: jest.fn(async () => '0x1234') });
    getReadContract.mockReturnValue({});
    const err = new Error('call exception');
    err.code = 'CALL_EXCEPTION';
    fetchImageRecord.mockRejectedValue(err);
    const { req, res } = createMocks({ method: 'GET', query: { id: IMAGE_HASH } });
    await handler(req, res);
    expect(res.statusCode).toBe(404);
    const body = res._getJSONData();
    expect(body.found).toBe(false);
    expect(body.message).toBe('No ZorAi record. This does NOT mean the content is real.');
  });

  test('405 for unsupported method', async () => {
    const { req, res } = createMocks({ method: 'DELETE' });
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });
});

describe('POST /api/verify', () => {
  test('400 when imageHash missing', async () => {
    const { req, res } = createMocks({ method: 'POST', body: {} });
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('200 with watermark match result', async () => {
    mockChainOk();
    const { req, res } = createMocks({
      method: 'POST',
      body: { imageHash: IMAGE_HASH, watermarkHash: mockWatermarkHash },
    });
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const body = res._getJSONData();
    expect(body.found).toBe(true);
    expect(body.watermark.matchesBlockchain).toBe(true);
  });
});
