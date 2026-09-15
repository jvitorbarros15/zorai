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
async function reconcile(job) {
  if (!job.txHash) return job;
  const receipt = await getReadProvider().getTransactionReceipt(job.txHash);
  if (receipt) {
    job.status = receipt.status === 1 ? "confirmed" : "failed";
    job.blockNumber = receipt.blockNumber;
    delete job.rawTransaction;
    await getStore().set(jobKey(job.imageHash), job);
    await getStore().eval(
      "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end; return 0",
      [signerKey("pending")],
      [job.imageHash],
    );
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
async function registerEvidence(envelope, client) {
  const store = getStore(),
    imageHash = envelope.claim.imageHash,
    fingerprint = requestDigest(envelope);
  let existing = await store.get(jobKey(imageHash));
  if (existing) {
    assert(
      existing.clientId === client.id && existing.fingerprint === fingerprint,
      409,
      "registration_conflict",
      "This digest is already reserved by another request.",
    );
    existing = await reconcile(existing);
    if (existing.status === "confirmed" || existing.status === "failed")
      return publicJob(existing);
  }
  const lockToken = crypto.randomUUID();
  const acquired = await store.set(signerKey("lock"), lockToken, {
    nx: true,
    ex: 90,
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
      assert(
        existing.clientId === client.id && existing.fingerprint === fingerprint,
        409,
        "registration_conflict",
        "This digest is already reserved by another request.",
      );
      existing = await reconcile(existing);
      if (["confirmed", "failed"].includes(existing.status))
        return publicJob(existing);
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
      const recovered = await reconcile(pending);
      if (!["confirmed", "failed"].includes(recovered.status)) {
        if (pendingHash !== imageHash)
          throw new ApiError(
            409,
            "publisher_pending",
            "A prior transaction is awaiting confirmation. Retry later.",
          );
        // Broadcast the exact persisted transaction; retries cannot create a second transaction.
        try {
          await getReadProvider().broadcastTransaction(pending.rawTransaction);
        } catch {
          /* receipt polling resolves uncertain broadcasts */
        }
        return publicJob(await reconcile(pending));
      }
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
    const evidenceCid = existing?.evidenceCid || (await pinEvidence(envelope));
    const populated = await contract.registerImage.populateTransaction(
      imageHash,
      envelope.claim.model,
      evidenceCid,
      0,
      [],
    );
    const transaction = await contract.runner.populateTransaction(populated);
    const rawTransaction = await contract.runner.signTransaction(transaction);
    const job = {
      imageHash,
      clientId: client.id,
      fingerprint,
      evidenceCid,
      envelope,
      rawTransaction,
      txHash: ethers.keccak256(rawTransaction),
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
    return publicJob(await reconcile(job));
  } finally {
    await store.eval(
      "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end; return 0",
      [signerKey("lock")],
      [lockToken],
    );
  }
}
module.exports = { registerEvidence, registrationStatus, requestDigest };
