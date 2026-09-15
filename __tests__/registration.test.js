const { ethers } = require("ethers");
const { memoryStore } = require("../test-support/fixtures.cjs");
jest.mock("../lib/zoraiRegistry");
jest.mock("../lib/ipfs");
jest.mock("../lib/store", () => ({
  getStore: () => store,
  namespace: () => "ns:",
}));
const { registerEvidence, requestDigest } = require("../lib/registration");
const { getWriteContract, getReadProvider, readRecord } = require("../lib/zoraiRegistry");
const { pinEvidence } = require("../lib/ipfs");
let store;
beforeEach(() => {
  jest.clearAllMocks();
  store = memoryStore();
  pinEvidence.mockResolvedValue("Qm1");
  readRecord.mockResolvedValue(null);
});
function createSignedTx() {
  const wallet = ethers.Wallet.createRandom();
  return {
    wallet,
    async sign() {
      return wallet.signTransaction({
        to: ethers.Wallet.createRandom().address,
        data: "0x",
        nonce: 5,
        gasLimit: 100000n,
        chainId: 31337,
        type: 2,
        maxFeePerGas: 10n,
        maxPriorityFeePerGas: 1n,
      });
    },
  };
}
test("new registration creates transaction with txHashes array and lastBroadcastAt", async () => {
  const imageHash = "1".repeat(64);
  const issuer = ethers.Wallet.createRandom();
  const claim = { imageHash, issuerId: "studio", source: "test", model: "test", issuedAt: new Date().toISOString(), nonce: "n1" };
  const signature = await issuer.signMessage(ethers.toUtf8Bytes(JSON.stringify(claim)));
  const envelope = { version: 1, kind: "eip712", claim, signature };
  const { wallet, sign } = createSignedTx();
  const rawTx = await sign();
  const txHash = ethers.keccak256(rawTx);
  getWriteContract.mockReturnValue({
    runner: { address: wallet.address, populateTransaction: jest.fn().mockResolvedValue({ to: wallet.address, data: "0x" }), signTransaction: jest.fn().mockResolvedValue(rawTx) },
    authorizedIssuers: jest.fn().mockResolvedValue(true),
    registerImage: { populateTransaction: jest.fn().mockResolvedValue({ to: wallet.address, data: "0x" }) },
  });
  getReadProvider.mockReturnValue({ broadcastTransaction: jest.fn(), getTransactionReceipt: jest.fn().mockResolvedValue(null) });
  const client = { id: "client1" };
  const result = await registerEvidence(envelope, client);
  expect(result.created).toBe(true);
  expect(result.job.status).toBe("submitted");
  const stored = await store.get("ns:registration:" + imageHash);
  expect(stored.txHashes).toEqual([txHash]);
  expect(stored.lastBroadcastAt).toBeDefined();
});
test("idempotent retry with same fingerprint returns created false", async () => {
  const imageHash = "2".repeat(64);
  const issuer = ethers.Wallet.createRandom();
  const claim = { imageHash, issuerId: "studio", source: "test", model: "test", issuedAt: new Date().toISOString(), nonce: "n1" };
  const signature = await issuer.signMessage(ethers.toUtf8Bytes(JSON.stringify(claim)));
  const envelope = { version: 1, kind: "eip712", claim, signature };
  const fingerprint = requestDigest(envelope);
  const { wallet, sign } = createSignedTx();
  const rawTx = await sign();
  const txHash = ethers.keccak256(rawTx);
  const stored = {
    imageHash,
    clientId: "client1",
    fingerprint,
    status: "submitted",
    txHash,
    txHashes: [txHash],
    rawTransaction: rawTx,
    lastBroadcastAt: new Date().toISOString(),
    evidenceCid: "Qm1",
    envelope,
    createdAt: new Date().toISOString(),
  };
  await store.set("ns:registration:" + imageHash, stored);
  getWriteContract.mockReturnValue({ runner: wallet });
  getReadProvider.mockReturnValue({ broadcastTransaction: jest.fn(), getTransactionReceipt: jest.fn().mockResolvedValue({ status: 1, blockNumber: 100 }) });
  const client = { id: "client1" };
  const result = await registerEvidence(envelope, client);
  expect(result.created).toBe(false);
  expect(result.job.status).toBe("confirmed");
});
test("failed job with same fingerprint is returned without retry", async () => {
  const imageHash = "3".repeat(64);
  const issuer = ethers.Wallet.createRandom();
  const claim = { imageHash, issuerId: "studio", source: "test", model: "test", issuedAt: new Date().toISOString(), nonce: "n1" };
  const signature = await issuer.signMessage(ethers.toUtf8Bytes(JSON.stringify(claim)));
  const envelope = { version: 1, kind: "eip712", claim, signature };
  const fingerprint = requestDigest(envelope);
  const failed = {
    imageHash,
    clientId: "client1",
    fingerprint,
    status: "failed",
    txHash: "0x" + "f".repeat(64),
    txHashes: ["0x" + "f".repeat(64)],
    evidenceCid: "Qm1",
    envelope,
    createdAt: new Date().toISOString(),
  };
  await store.set("ns:registration:" + imageHash, failed);
  const client = { id: "client1" };
  const result = await registerEvidence(envelope, client);
  expect(result.created).toBe(false);
  expect(result.job.status).toBe("failed");
});
test("confirmed status does not call getTransactionReceipt", async () => {
  const imageHash = "4".repeat(64);
  const issuer = ethers.Wallet.createRandom();
  const claim = { imageHash, issuerId: "studio", source: "test", model: "test", issuedAt: new Date().toISOString(), nonce: "n1" };
  const signature = await issuer.signMessage(ethers.toUtf8Bytes(JSON.stringify(claim)));
  const envelope = { version: 1, kind: "eip712", claim, signature };
  const fingerprint = requestDigest(envelope);
  const confirmed = {
    imageHash,
    clientId: "client1",
    fingerprint,
    status: "confirmed",
    txHash: "0x" + "f".repeat(64),
    blockNumber: 100,
    evidenceCid: "Qm1",
    envelope,
    createdAt: new Date().toISOString(),
  };
  await store.set("ns:registration:" + imageHash, confirmed);
  const mockReceipt = jest.fn();
  getReadProvider.mockReturnValue({ getTransactionReceipt: mockReceipt, broadcastTransaction: jest.fn() });
  const client = { id: "client1" };
  const result = await registerEvidence(envelope, client);
  expect(mockReceipt).not.toHaveBeenCalled();
  expect(result.job.status).toBe("confirmed");
});
