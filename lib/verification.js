const { ApiError } = require("./api");
const { readRecord, publicNetwork } = require("./zoraiRegistry");
const { readEvidence } = require("./ipfs");
const { validateEnvelope } = require("./attestation");

async function verifyImage(imageHash) {
  const record = await readRecord(imageHash);
  const network = publicNetwork();
  if (!record)
    return {
      found: false,
      status: "unknown",
      aiOrigin: "unknown",
      isAiGenerated: null,
      imageHash,
      network,
      message:
        "No matching ZorAI record. This does not mean the image is real or non-AI.",
    };
  const base = {
    found: true,
    imageHash,
    registeredAt: record.registeredAt,
    registrar: record.registrar,
    evidenceCid: record.evidenceCid,
    network,
  };
  let envelope;
  try {
    envelope = await readEvidence(record.evidenceCid);
  } catch (error) {
    if (error.code === "legacy_record" || error.code === "invalid_evidence")
      return {
        ...base,
        status: "unvalidated_record",
        aiOrigin: "unknown",
        isAiGenerated: null,
        message:
          "A registry entry exists, but its evidence is not a supported signed attestation.",
      };
    throw error;
  }
  try {
    const { claim, issuer } = validateEnvelope(envelope);
    if (claim.imageHash !== imageHash || claim.model !== record.model)
      throw new ApiError(
        422,
        "evidence_mismatch",
        "The stored claim does not match the registry entry.",
      );
    return {
      ...base,
      status: "attested",
      aiOrigin: "ai_generated_attested",
      isAiGenerated: true,
      message:
        "AI origin attested by " +
        issuer.name +
        ". The exact file digest and issuer signature match.",
      issuer,
      source: claim.source,
      model: claim.model,
      evidence: {
        kind: "issuer_attestation",
        signatureValid: true,
        assetBinding: "sha256-final-bytes",
        envelope,
      },
      limitations:
        "This validates an approved issuer’s claim, not the truth of the depicted scene. Changed copies need their own matching evidence.",
    };
  } catch (error) {
    if (!(error instanceof ApiError) || error.status >= 500) throw error;
    return {
      ...base,
      status:
        error.code === "evidence_mismatch"
          ? "mismatch"
          : "untrusted_attestation",
      aiOrigin: "unknown",
      isAiGenerated: null,
      message: error.message,
    };
  }
}
module.exports = { verifyImage };
