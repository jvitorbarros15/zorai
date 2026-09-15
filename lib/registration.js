const crypto = require("crypto");
const { ethers } = require("ethers");
const { ApiError, assert } = require("./api");
const { getStore, namespace } = require("./store");
const {
  getWriteContract,
  getReadProvider,
  readRecord,
  publicNetwork,
} = require("./zoraiRegistry");
const { pinEvidence } = require("./ipfs");
const { sha256 } = require("./assets");

function jobKey(imageHash) {
  return namespace() + "registration:" + imageHash;
}
function signerKey(kind) {
  return namespace() + "signer-" + kind;
}
function requestDigest(envelope) {
  // Claim fields are serialized in a fixed order so JSON property order is irrelevant.
  const c = envelope.claim;
  return sha256(
    Buffer.from(
      JSON.stringify([
        envelope.version,
        envelope.kind,
        c.imageHash,
        c.issuerId,
        c.source,
        c.model,
        c.issuedAt,
        c.nonce,
        envelope.signature.toLowerCase(),
      ]),
    ),
  );
}
function publicJob(job) {
  return {
    imageHash: job.imageHash,
    status: job.status,
    txHash: job.txHash || null,
    evidenceCid: job.evidenceCid || null,
    blockNumber: job.blockNumber || null,
    network: publicNetwork(),
  };
}
async function holdsLock(token) {
  return (await getStore().get(signerKey("lock"))) === token;
}
async function reconcile(job) {
  if (["confirmed", "failed", "dropped"].includes(job.status)) return job;
  for (const hash of job.txHashes) {
    const receipt = await getReadProvider().getTransactionReceipt(hash);
    if (receipt) {
      job.txHash = hash;
      job.status = receipt.status === 1 ? "confirmed" : "failed";
      job.blockNumber = receipt.blockNumber;
      delete job.rawTransaction;
      await getStore().set(jobKey(job.imageHash), job);
      await getStore().eval(
        "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end; return 0",
        [signerKey("pending")],
        [job.imageHash],
      );
      return job;
    }
  }
  return job;
}
async function registrationStatus(imageHash, client) {
  const job = await getStore().get(jobKey(imageHash));
  assert(
    job && job.clientId === client.id,
    404,
    "job_not_found",
    "No registration job belongs to this account.",
  );
  return publicJob(await reconcile(job));
}
async function recoverStuck(job, lockToken) {
  const STUCK_MS = Number(process.env.ZORAI_STUCK_TX_SECONDS || 600) * 1000;
  if (Date.now() - Date.parse(job.lastBroadcastAt) < STUCK_MS) {
    try {
      await getReadProvider().broadcastTransaction(job.rawTransaction);
    } catch {
      /* receipt polling resolves uncertain broadcasts */
    }
    return reconcile(job);
  }
  const tx = ethers.Transaction.from(job.rawTransaction);
  const latest = await getReadProvider().getTransactionCount(tx.from, "latest");
  await reconcile(job);
  if (["confirmed", "failed", "dropped"].includes(job.status)) return job;
  if (latest > tx.nonce) {
    const record = await readRecord(job.imageHash);
    job.status = record ? "confirmed" : "dropped";
    delete job.rawTransaction;
    await getStore().set(jobKey(job.imageHash), job);
    await getStore().eval(
      "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end; return 0",
      [signerKey("pending")],
      [job.imageHash],
    );
    return job;
  }
  assert(
    await holdsLock(lockToken),
    409,
    "publisher_busy",
    "Publishing lock expired. Retry this same request.",
  );
  const wallet = getWriteContract().runner;
  const fee = await getReadProvider().getFeeData();
  const bump = (v) => (v * 125n) / 100n;
  const max = (a, b) => (a > b ? a : b);
  const built = {
    to: tx.to,
    data: tx.data,
    value: 0n,
    nonce: tx.nonce,
    gasLimit: tx.gasLimit,
    chainId: tx.chainId,
    type: tx.type,
  };
  if (tx.type === 2) {
    built.maxFeePerGas = max(bump(tx.maxFeePerGas), fee.maxFeePerGas ?? 0n);
    built.maxPriorityFeePerGas = max(
      bump(tx.maxPriorityFeePerGas),
      fee.maxPriorityFeePerGas ?? 0n,
    );
  } else {
    built.gasPrice = max(bump(tx.gasPrice), fee.gasPrice ?? 0n);
  }
  const raw = await wallet.signTransaction(built);
  const hash = ethers.keccak256(raw);
  job.rawTransaction = raw;
  job.txHash = hash;
  job.txHashes.push(hash);
  job.lastBroadcastAt = new Date().toISOString();
  await getStore().set(jobKey(job.imageHash), job);
  try {
    await getReadProvider().broadcastTransaction(raw);
  } catch {
    /* receipt polling resolves uncertain broadcasts */
  }
  return reconcile(job);
}
async function registerEvidence(envelope, client) {
  const store = getStore(),
    imageHash = envelope.claim.imageHash,
    fingerprint = requestDigest(envelope);
  let existing = await store.get(jobKey(imageHash));
  if (existing) {
    if (["failed", "dropped"].includes(existing.status)) {
      if (
        existing.clientId === client.id &&
        existing.fingerprint === fingerprint
      ) {
        return { job: publicJob(existing), created: false };
      }
      await store.set(
        namespace() + "registration-archive:" + imageHash + ":" + Date.now(),
        existing,
        { ex: 90 * 86400 },
      );
      existing = null;
    } else {
      assert(
        existing.clientId === client.id && existing.fingerprint === fingerprint,
        409,
        "registration_conflict",
        "This digest is already reserved by another request.",
      );
      existing = await reconcile(existing);
      if (["confirmed", "failed", "dropped"].includes(existing.status))
        return { job: publicJob(existing), created: false };
    }
  }
  const lockToken = crypto.randomUUID();
  const acquired = await store.set(signerKey("lock"), lockToken, {
    nx: true,
    ex: 180,
  });
  assert(
    acquired,
    409,
    "publisher_busy",
    "Another registration is being processed. Retry this same request.",
  );
  try {
    existing = await store.get(jobKey(imageHash));
    if (existing) {
      if (["failed", "dropped"].includes(existing.status)) {
        if (
          existing.clientId === client.id &&
          existing.fingerprint === fingerprint
        ) {
          return { job: publicJob(existing), created: false };
        }
        await store.set(
          namespace() + "registration-archive:" + imageHash + ":" + Date.now(),
          existing,
          { ex: 90 * 86400 },
        );
        existing = null;
      } else {
        assert(
          existing.clientId === client.id &&
            existing.fingerprint === fingerprint,
          409,
          "registration_conflict",
          "This digest is already reserved by another request.",
        );
        existing = await reconcile(existing);
        if (["confirmed", "failed", "dropped"].includes(existing.status))
          return { job: publicJob(existing), created: false };
      }
    }
    const pendingHash = await store.get(signerKey("pending"));
    if (pendingHash) {
      const pending = await store.get(jobKey(pendingHash));
      assert(
        pending,
        503,
        "publisher_recovery_required",
        "The publishing queue needs operator recovery.",
      );
      const recovered = await recoverStuck(pending, lockToken);
      if (pendingHash === imageHash)
        return { job: publicJob(recovered), created: false };
      if (!["confirmed", "failed", "dropped"].includes(recovered.status))
        throw new ApiError(
          409,
          "publisher_pending",
          "A prior transaction is awaiting confirmation. Retry later.",
        );
    }
    const onChain = await readRecord(imageHash);
    assert(
      !onChain,
      409,
      "already_registered",
      "This file is already registered. Verify the existing record.",
    );
    const contract = getWriteContract();
    assert(
      await contract.authorizedIssuers(contract.runner.address),
      503,
      "registrar_not_authorized",
      "The service signer is not approved by the registry.",
    );
    assert(
      await holdsLock(lockToken),
      409,
      "publisher_busy",
      "Publishing lock expired. Retry this same request.",
    );
    const evidenceCid = existing?.evidenceCid || (await pinEvidence(envelope));
    const populated = await contract.registerImage.populateTransaction(
      imageHash,
      envelope.claim.model,
      evidenceCid,
      0,
      [],
    );
    const transaction = await contract.runner.populateTransaction(populated);
    assert(
      await holdsLock(lockToken),
      409,
      "publisher_busy",
      "Publishing lock expired. Retry this same request.",
    );
    const rawTransaction = await contract.runner.signTransaction(transaction);
    const txHash = ethers.keccak256(rawTransaction);
    const job = {
      imageHash,
      clientId: client.id,
      fingerprint,
      evidenceCid,
      envelope,
      rawTransaction,
      txHash,
      txHashes: [txHash],
      lastBroadcastAt: new Date().toISOString(),
      status: "submitted",
      createdAt: new Date().toISOString(),
    };
    // Both records are persisted before broadcast. A crash leaves a recoverable signed transaction.
    await store
      .multi()
      .set(jobKey(imageHash), job)
      .set(signerKey("pending"), imageHash)
      .exec();
    try {
      await getReadProvider().broadcastTransaction(rawTransaction);
    } catch {
      /* return the real transaction hash with pending status */
    }
    return { job: publicJob(await reconcile(job)), created: true };
  } finally {
    await store.eval(
      "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end; return 0",
      [signerKey("lock")],
      [lockToken],
    );
  }
}
module.exports = {
  registerEvidence,
  registrationStatus,
  requestDigest,
  recoverStuck,
  holdsLock,
};
