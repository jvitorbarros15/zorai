const { assert, ApiError } = require("./api");
function validCid(cid) {
  return (
    typeof cid === "string" &&
    (/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid) ||
      /^b[a-z2-7]{30,100}$/.test(cid))
  );
}
async function boundedJson(response, maxBytes = 65536) {
  if (!response.ok)
    throw new ApiError(
      503,
      "storage_unavailable",
      "Provenance storage is temporarily unavailable.",
    );
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      assert(
        total <= maxBytes,
        502,
        "invalid_evidence",
        "The stored evidence exceeds the size limit.",
      );
      chunks.push(Buffer.from(value));
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(
      502,
      "invalid_evidence",
      "The stored evidence is not valid JSON.",
    );
  }
}
async function pinEvidence(envelope) {
  assert(
    process.env.PINATA_JWT,
    503,
    "storage_unconfigured",
    "Evidence publishing is not configured.",
  );
  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.PINATA_JWT,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pinataContent: envelope,
        pinataMetadata: { name: "zorai-attestation-v1" },
      }),
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    },
  );
  const result = await boundedJson(response);
  assert(
    validCid(result.IpfsHash),
    502,
    "invalid_storage_result",
    "Storage did not return a valid evidence identifier.",
  );
  return result.IpfsHash;
}
async function readEvidence(cid) {
  assert(
    validCid(cid),
    422,
    "legacy_record",
    "This registry entry has no supported evidence document.",
  );
  // Destination is fixed: registry data cannot redirect the server to an arbitrary host.
  const response = await fetch("https://gateway.pinata.cloud/ipfs/" + cid, {
    signal: AbortSignal.timeout(12000),
    redirect: "error",
  });
  return boundedJson(response);
}
module.exports = { validCid, boundedJson, pinEvidence, readEvidence };
