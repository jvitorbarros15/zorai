const { ethers } = require("ethers");
const { memoryStore } = require("../test-support/fixtures.cjs");
jest.mock("../lib/zoraiRegistry");
jest.mock("../lib/ipfs");
jest.mock("../lib/store", () => ({
  getStore: () => store,
  namespace: () => "ns:",
}));
const {
  registerEvidence,
  registrationStatus,
  requestDigest,
} = require("../lib/registration");
const {
  getWriteContract,
  getReadProvider,
  readRecord,
} = require("../lib/zoraiRegistry");
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
  const claim = {
    imageHash,
    issuerId: "studio",
    source: "test",
    model: "test",
    issuedAt: new Date().toISOString(),
    nonce: "n1",
  };
  const signature = await issuer.signMessage(
    ethers.toUtf8Bytes(JSON.stringify(claim)),
  );
  const envelope = { version: 1, kind: "eip712", claim, signature };
  const { wallet, sign } = createSignedTx();
  const rawTx = await sign();
  const txHash = ethers.keccak256(rawTx);
  getWriteContract.mockReturnValue({
    runner: {
      address: wallet.address,
      populateTransaction: jest
        .fn()
        .mockResolvedValue({ to: wallet.address, data: "0x" }),
      signTransaction: jest.fn().mockResolvedValue(rawTx),
    },
    authorizedIssuers: jest.fn().mockResolvedValue(true),
    registerImage: {
      populateTransaction: jest
        .fn()
        .mockResolvedValue({ to: wallet.address, data: "0x" }),
    },
  });
  getReadProvider.mockReturnValue({
    broadcastTransaction: jest.fn(),
    getTransactionReceipt: jest.fn().mockResolvedValue(null),
  });
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
  const claim = {
    imageHash,
    issuerId: "studio",
    source: "test",
    model: "test",
    issuedAt: new Date().toISOString(),
    nonce: "n1",
  };
  const signature = await issuer.signMessage(
    ethers.toUtf8Bytes(JSON.stringify(claim)),
  );
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
  getReadProvider.mockReturnValue({
    broadcastTransaction: jest.fn(),
    getTransactionReceipt: jest
      .fn()
      .mockResolvedValue({ status: 1, blockNumber: 100 }),
  });
  const client = { id: "client1" };
  const result = await registerEvidence(envelope, client);
  expect(result.created).toBe(false);
  expect(result.job.status).toBe("confirmed");
});
test("failed job with same fingerprint is returned without retry", async () => {
  const imageHash = "3".repeat(64);
  const issuer = ethers.Wallet.createRandom();
  const claim = {
    imageHash,
    issuerId: "studio",
    source: "test",
    model: "test",
    issuedAt: new Date().toISOString(),
    nonce: "n1",
  };
  const signature = await issuer.signMessage(
    ethers.toUtf8Bytes(JSON.stringify(claim)),
  );
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
  const claim = {
    imageHash,
    issuerId: "studio",
    source: "test",
    model: "test",
    issuedAt: new Date().toISOString(),
    nonce: "n1",
  };
  const signature = await issuer.signMessage(
    ethers.toUtf8Bytes(JSON.stringify(claim)),
  );
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
  getReadProvider.mockReturnValue({
    getTransactionReceipt: mockReceipt,
    broadcastTransaction: jest.fn(),
  });
  const client = { id: "client1" };
  const result = await registerEvidence(envelope, client);
  expect(mockReceipt).not.toHaveBeenCalled();
  expect(result.job.status).toBe("confirmed");
});
test("pending job younger than STUCK throws publisher_pending and broadcasts", async () => {
  process.env.ZORAI_STUCK_TX_SECONDS = "600";
  const imageHash = "5".repeat(64);
  const issuer = ethers.Wallet.createRandom();
  const claim = {
    imageHash,
    issuerId: "studio",
    source: "test",
    model: "test",
    issuedAt: new Date().toISOString(),
    nonce: "n1",
  };
  const signature = await issuer.signMessage(
    ethers.toUtf8Bytes(JSON.stringify(claim)),
  );
  const envelope = { version: 1, kind: "eip712", claim, signature };
  const { wallet, sign } = createSignedTx();
  const rawTx = await sign();
  const txHash = ethers.keccak256(rawTx);
  const pending = {
    imageHash,
    clientId: "client1",
    fingerprint: requestDigest(envelope),
    status: "submitted",
    txHash,
    txHashes: [txHash],
    rawTransaction: rawTx,
    lastBroadcastAt: new Date().toISOString(),
    evidenceCid: "Qm1",
    envelope,
    createdAt: new Date().toISOString(),
  };
  await store.set("ns:registration:" + imageHash, pending);
  await store.set("ns:signer-pending", imageHash);
  const mockBroadcast = jest.fn();
  const mockSignTx = jest.fn();
  getReadProvider.mockReturnValue({
    broadcastTransaction: mockBroadcast,
    getTransactionReceipt: jest.fn().mockResolvedValue(null),
  });
  const mockWallet = { signTransaction: mockSignTx };
  getWriteContract.mockReturnValue({ runner: mockWallet });
  const otherImageHash = "6".repeat(64);
  const otherClaim = {
    imageHash: otherImageHash,
    issuerId: "studio",
    source: "test",
    model: "test",
    issuedAt: new Date().toISOString(),
    nonce: "n2",
  };
  const otherSignature = await issuer.signMessage(
    ethers.toUtf8Bytes(JSON.stringify(otherClaim)),
  );
  const otherEnvelope = {
    version: 1,
    kind: "eip712",
    claim: otherClaim,
    signature: otherSignature,
  };
  let error;
  try {
    await registerEvidence(otherEnvelope, { id: "client1" });
  } catch (e) {
    error = e;
  }
  expect(error).toBeDefined();
  expect(error.code).toBe("publisher_pending");
  expect(mockSignTx).not.toHaveBeenCalled();
  expect(mockBroadcast).toHaveBeenCalled();
});
function envelopeFor(imageHash, issuedAt = 1) {
  return {
    version: 1,
    kind: "issuer_attestation",
    claim: {
      imageHash,
      issuerId: "studio",
      source: "test",
      model: "m",
      issuedAt,
      nonce: "n1",
    },
    signature: "0x" + "a".repeat(130),
  };
}
async function seedPending(
  imageHash,
  { ageSeconds = 3600, extraHashes = [] } = {},
) {
  const wallet = ethers.Wallet.createRandom();
  const raw = await wallet.signTransaction({
    to: wallet.address,
    data: "0x",
    nonce: 5,
    gasLimit: 100000n,
    chainId: 31337,
    type: 2,
    maxFeePerGas: 10n,
    maxPriorityFeePerGas: 4n,
  });
  const txHash = ethers.keccak256(raw);
  const envelope = envelopeFor(imageHash);
  await store.set("ns:registration:" + imageHash, {
    imageHash,
    clientId: "client1",
    fingerprint: requestDigest(envelope),
    status: "submitted",
    evidenceCid: "Qm1",
    envelope,
    rawTransaction: raw,
    txHash,
    txHashes: [txHash, ...extraHashes],
    lastBroadcastAt: new Date(Date.now() - ageSeconds * 1000).toISOString(),
  });
  await store.set("ns:signer-pending", imageHash);
  return { wallet, txHash, envelope };
}
function fakeProvider(overrides = {}) {
  return {
    broadcastTransaction: jest.fn(),
    getTransactionReceipt: jest.fn().mockResolvedValue(null),
    getTransactionCount: jest.fn().mockResolvedValue(5),
    getFeeData: jest
      .fn()
      .mockResolvedValue({ maxFeePerGas: 1n, maxPriorityFeePerGas: 1n }),
    ...overrides,
  };
}
function fakeContract(wallet, signTransaction) {
  return {
    runner: {
      address: wallet.address,
      populateTransaction: jest.fn().mockResolvedValue({}),
      signTransaction: jest.fn(
        signTransaction || ((tx) => wallet.signTransaction(tx)),
      ),
    },
    authorizedIssuers: jest.fn().mockResolvedValue(true),
    registerImage: { populateTransaction: jest.fn().mockResolvedValue({}) },
  };
}
async function nextRaw(wallet) {
  return wallet.signTransaction({
    to: wallet.address,
    data: "0x",
    nonce: 6,
    gasLimit: 100000n,
    chainId: 31337,
    type: 2,
    maxFeePerGas: 10n,
    maxPriorityFeePerGas: 1n,
  });
}
test("stuck transaction with unused nonce is replaced with bumped fees", async () => {
  const imageHash = "7".repeat(64);
  const { wallet, txHash, envelope } = await seedPending(imageHash);
  const provider = fakeProvider();
  getReadProvider.mockReturnValue(provider);
  getWriteContract.mockReturnValue(fakeContract(wallet));
  const result = await registerEvidence(envelope, { id: "client1" });
  const stored = await store.get("ns:registration:" + imageHash);
  const replacement = ethers.Transaction.from(stored.rawTransaction);
  expect(result.created).toBe(false);
  expect(stored.txHashes).toEqual([txHash, stored.txHash]);
  expect(stored.txHash).not.toBe(txHash);
  expect(replacement.nonce).toBe(5);
  expect(replacement.maxFeePerGas).toBe(12n);
  expect(replacement.maxPriorityFeePerGas).toBe(5n);
  expect(provider.broadcastTransaction).toHaveBeenCalledWith(
    stored.rawTransaction,
  );
});
test("receipt for a replacement hash confirms the job and clears pending", async () => {
  const imageHash = "8".repeat(64);
  const replacementHash = "0x" + "b".repeat(64);
  await seedPending(imageHash, { extraHashes: [replacementHash] });
  getReadProvider.mockReturnValue(
    fakeProvider({
      getTransactionReceipt: jest.fn(async (hash) =>
        hash === replacementHash ? { status: 1, blockNumber: 9 } : null,
      ),
    }),
  );
  const job = await registrationStatus(imageHash, { id: "client1" });
  expect(job.status).toBe("confirmed");
  expect(job.txHash).toBe(replacementHash);
  expect(await store.get("ns:signer-pending")).toBeNull();
});
test("consumed nonce without receipt drops the job and releases the queue", async () => {
  const stuckHash = "9".repeat(64);
  const nextHash = "a".repeat(64);
  const { wallet } = await seedPending(stuckHash);
  const raw = await nextRaw(wallet);
  getReadProvider.mockReturnValue(
    fakeProvider({ getTransactionCount: jest.fn().mockResolvedValue(6) }),
  );
  getWriteContract.mockReturnValue(fakeContract(wallet, async () => raw));
  const result = await registerEvidence(envelopeFor(nextHash), {
    id: "client1",
  });
  expect(result.created).toBe(true);
  expect((await store.get("ns:registration:" + stuckHash)).status).toBe(
    "dropped",
  );
  expect(await store.get("ns:signer-pending")).toBe(nextHash);
});
test("consumed nonce with an on-chain record confirms the stuck job", async () => {
  const stuckHash = "b".repeat(64);
  const nextHash = "c".repeat(64);
  const { wallet } = await seedPending(stuckHash);
  const raw = await nextRaw(wallet);
  readRecord.mockImplementation(async (hash) =>
    hash === stuckHash ? { imageHash: hash } : null,
  );
  getReadProvider.mockReturnValue(
    fakeProvider({ getTransactionCount: jest.fn().mockResolvedValue(6) }),
  );
  getWriteContract.mockReturnValue(fakeContract(wallet, async () => raw));
  const result = await registerEvidence(envelopeFor(nextHash), {
    id: "client1",
  });
  expect(result.created).toBe(true);
  expect((await store.get("ns:registration:" + stuckHash)).status).toBe(
    "confirmed",
  );
});
test("failed job with a newly signed claim is archived and retried", async () => {
  const imageHash = "d".repeat(64);
  const old = envelopeFor(imageHash, 1);
  await store.set("ns:registration:" + imageHash, {
    imageHash,
    clientId: "client1",
    fingerprint: requestDigest(old),
    status: "failed",
    txHashes: ["0x" + "f".repeat(64)],
  });
  const wallet = ethers.Wallet.createRandom();
  const raw = await nextRaw(wallet);
  getReadProvider.mockReturnValue(fakeProvider());
  getWriteContract.mockReturnValue(fakeContract(wallet, async () => raw));
  const result = await registerEvidence(envelopeFor(imageHash, 2), {
    id: "client1",
  });
  expect(result.created).toBe(true);
  expect(
    store
      .keys()
      .some((key) =>
        key.startsWith("ns:registration-archive:" + imageHash + ":"),
      ),
  ).toBe(true);
  expect((await store.get("ns:registration:" + imageHash)).status).toBe(
    "submitted",
  );
});
test("lost signer lock before signing rejects without saving a job", async () => {
  const imageHash = "e".repeat(64);
  const wallet = ethers.Wallet.createRandom();
  const contract = fakeContract(wallet);
  getReadProvider.mockReturnValue(fakeProvider());
  getWriteContract.mockReturnValue(contract);
  pinEvidence.mockImplementation(async () => {
    await store.set("ns:signer-lock", "another-request");
    return "Qm1";
  });
  await expect(
    registerEvidence(envelopeFor(imageHash), { id: "client1" }),
  ).rejects.toMatchObject({
    code: "publisher_busy",
  });
  expect(contract.runner.signTransaction).not.toHaveBeenCalled();
  expect(await store.get("ns:registration:" + imageHash)).toBeNull();
});
