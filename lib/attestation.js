const { ethers } = require("ethers");
const { assert, object, hash } = require("./api");
const { configList } = require("./access");

const TYPES = {
  Provenance: [
    { name: "imageHash", type: "string" },
    { name: "issuerId", type: "string" },
    { name: "source", type: "string" },
    { name: "model", type: "string" },
    { name: "issuedAt", type: "uint64" },
    { name: "nonce", type: "string" },
  ],
};
function domain() {
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const chainId = Number(process.env.ZORAI_CHAIN_ID || 84532);
  assert(
    ethers.isAddress(address) && Number.isSafeInteger(chainId) && chainId > 0,
    503,
    "registry_unconfigured",
    "The registry is not configured.",
  );
  return {
    name: "ZorAI Provenance",
    version: "1",
    chainId,
    verifyingContract: address,
  };
}
function validateClaim(value) {
  object(value);
  const fields = [
    "imageHash",
    "issuerId",
    "source",
    "model",
    "issuedAt",
    "nonce",
  ];
  assert(
    Object.keys(value).length === fields.length &&
      fields.every((k) => Object.prototype.hasOwnProperty.call(value, k)),
    400,
    "invalid_claim",
    "The signed claim must contain exactly the documented fields.",
  );
  assert(
    hash(value.imageHash) === value.imageHash,
    400,
    "invalid_claim",
    "Signed digests must use lowercase hexadecimal.",
  );
  for (const field of ["issuerId", "source", "model", "nonce"]) {
    assert(
      typeof value[field] === "string" &&
        /^[a-zA-Z0-9._:/-]{1,120}$/.test(value[field]),
      400,
      "invalid_claim",
      "Invalid claim field: " + field,
    );
  }
  assert(
    Number.isSafeInteger(value.issuedAt) &&
      value.issuedAt > 0 &&
      value.issuedAt <= Math.floor(Date.now() / 1000) + 300,
    400,
    "invalid_claim",
    "The claim timestamp is invalid.",
  );
  return value;
}
function validateEnvelope(envelope, options = {}) {
  object(envelope);
  assert(
    envelope.version === 1 && envelope.kind === "issuer_attestation",
    400,
    "unsupported_evidence",
    "A version 1 signed issuer attestation is required.",
  );
  const claim = validateClaim(envelope.claim);
  const expected = domain();
  const supplied = envelope.domain;
  assert(
    supplied &&
      Object.keys(supplied).length === 4 &&
      supplied.name === expected.name &&
      supplied.version === expected.version &&
      supplied.chainId === expected.chainId &&
      typeof supplied.verifyingContract === "string" &&
      supplied.verifyingContract.toLowerCase() ===
        expected.verifyingContract.toLowerCase(),
    400,
    "wrong_domain",
    "The attestation belongs to another registry or network.",
  );
  assert(
    typeof envelope.signature === "string" &&
      /^0x[a-fA-F0-9]{130}$/.test(envelope.signature),
    400,
    "invalid_signature",
    "A valid issuer signature is required.",
  );
  const issuers = configList("ZORAI_ISSUERS_JSON");
  const issuer = issuers.find((entry) => entry.id === claim.issuerId);
  assert(
    issuer && issuer.active === true && ethers.isAddress(issuer.address),
    422,
    "untrusted_issuer",
    "The issuing identity is unknown or has been revoked.",
  );
  assert(
    Array.isArray(issuer.sources) && issuer.sources.includes(claim.source),
    422,
    "untrusted_source",
    "This issuer is not approved for the claimed source.",
  );
  let recovered;
  try {
    recovered = ethers.verifyTypedData(
      expected,
      TYPES,
      claim,
      envelope.signature,
    );
  } catch {
    assert(
      false,
      422,
      "invalid_signature",
      "The issuer signature could not be validated.",
    );
  }
  assert(
    recovered.toLowerCase() === issuer.address.toLowerCase(),
    422,
    "invalid_signature",
    "The claim does not match the approved issuer signature.",
  );
  if (options.fresh)
    assert(
      claim.issuedAt >= Math.floor(Date.now() / 1000) - 86400,
      422,
      "stale_claim",
      "New registrations require a claim issued within the last 24 hours.",
    );
  return {
    claim,
    issuer: {
      id: issuer.id,
      name: issuer.name || issuer.id,
      address: recovered,
    },
    envelope,
  };
}
module.exports = { TYPES, domain, validateClaim, validateEnvelope };
