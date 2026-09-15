const { ethers } = require("ethers");
const { prepareRegistration } = require("../sdk");
const { validateEnvelope } = require("../lib/attestation");
const {
  inspectAsset,
  prepareAsset,
  pngChunk,
  sha256,
} = require("../lib/assets");
const { png } = require("../test-support/fixtures.cjs");
let prepared, issuer;
beforeEach(async () => {
  issuer = ethers.Wallet.createRandom();
  process.env.ZORAI_CHAIN_ID = "31337";
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS =
    ethers.Wallet.createRandom().address;
  process.env.ZORAI_ISSUERS_JSON = JSON.stringify([
    {
      id: "studio",
      address: issuer.address,
      active: true,
      sources: ["source"],
    },
  ]);
  prepared = await prepareRegistration({
    bytes: png(),
    signer: issuer,
    issuerId: "studio",
    source: "source",
    model: "test",
    chainId: 31337,
    registryAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  });
});
test("marker precedes the digest; final published bytes match the signed claim", () => {
  expect(sha256(prepared.bytes)).toBe(prepared.evidence.claim.imageHash);
  expect(sha256(png())).not.toBe(prepared.evidence.claim.imageHash);
  expect(inspectAsset(prepared.bytes).marker.nonce).toBe(
    prepared.evidence.claim.nonce,
  );
  expect(validateEnvelope(prepared.evidence).issuer.address).toBe(
    issuer.address,
  );
});
test("domain field ordering and address casing do not affect validation", () => {
  const d = prepared.evidence.domain;
  prepared.evidence.domain = {
    verifyingContract: d.verifyingContract.toLowerCase(),
    chainId: d.chainId,
    version: d.version,
    name: d.name,
  };
  expect(() => validateEnvelope(prepared.evidence)).not.toThrow();
});
test("another chain or registry cannot reuse a claim", () => {
  prepared.evidence.domain.chainId = 8453;
  expect(() => validateEnvelope(prepared.evidence)).toThrow(/another registry/);
});
test("revoked issuer remains unknown despite a valid signature", () => {
  const config = JSON.parse(process.env.ZORAI_ISSUERS_JSON);
  config[0].active = false;
  process.env.ZORAI_ISSUERS_JSON = JSON.stringify(config);
  expect(() => validateEnvelope(prepared.evidence)).toThrow(/revoked/);
});
test("PNG corruption is rejected", () => {
  const broken = Buffer.from(prepared.bytes);
  broken[20] ^= 1;
  expect(() => inspectAsset(broken)).toThrow(/checksum/);
});
test("duplicate metadata is rejected", () => {
  expect(() =>
    prepareAsset(prepared.bytes, {
      version: 1,
      issuerId: "studio",
      nonce: "other",
    }),
  ).toThrow(/already/);
});
test("recognized C2PA credentials are preserved by refusing modification", () => {
  const image = png([pngChunk("caBX", Buffer.from("signed-source"))]);
  expect(() =>
    prepareAsset(image, { version: 1, issuerId: "studio", nonce: "n" }),
  ).toThrow(/Preserve/);
});
test("unsigned free text cannot masquerade as a marker", () => {
  expect(() =>
    prepareAsset(png(), {
      version: 1,
      issuerId: "studio",
      nonce: "n",
      aiGenerated: true,
    }),
  ).toThrow(/Unsupported/);
});
