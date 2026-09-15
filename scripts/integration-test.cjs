// Real ephemeral EVM deployment; Redis and IPFS are explicit local test doubles.
const assert = require("node:assert/strict");
const { png, memoryStore } = require("../test-support/fixtures.cjs");
async function main() {
  const hre = require("hardhat");
  await hre.run("compile");
  const wallet = new hre.ethers.Wallet(
    "0x" + "1".repeat(64),
    hre.ethers.provider,
  );
  await hre.network.provider.send("hardhat_setBalance", [
    wallet.address,
    "0x56BC75E2D63100000",
  ]);
  const factory = await hre.ethers.getContractFactory("ZorAiRegistry", wallet);
  const registry = await factory.deploy();
  await registry.waitForDeployment();
  process.env.ZORAI_CHAIN_ID = "31337";
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = await registry.getAddress();
  const registryModule = require("../lib/zoraiRegistry");
  let dropBroadcast = true;
  registryModule.getReadProvider = () => ({
    getTransactionReceipt: (hash) =>
      hre.ethers.provider.getTransactionReceipt(hash),
    broadcastTransaction: (raw) => {
      if (dropBroadcast) {
        dropBroadcast = false;
        throw new Error("Simulated interrupted broadcast");
      }
      return hre.ethers.provider.broadcastTransaction(raw);
    },
  });
  registryModule.getWriteContract = () => registry;
  registryModule.readRecord = async (hash) => {
    if (!(await registry.isImageRegistered(hash))) return null;
    const d = await registry.getImageData(hash);
    return {
      evidenceCid: d[0],
      model: d[1],
      registrar: d[2],
      registeredAt: new Date(Number(d[3]) * 1000).toISOString(),
    };
  };
  const store = memoryStore();
  require("../lib/store").getStore = () => store;
  const evidence = new Map();
  let pins = 0;
  const ipfs = require("../lib/ipfs");
  ipfs.pinEvidence = async (value) => {
    const cid = "Qm" + "a".repeat(44);
    evidence.set(cid, structuredClone(value));
    pins++;
    return cid;
  };
  ipfs.readEvidence = async (cid) => structuredClone(evidence.get(cid));
  const { prepareRegistration } = require("../sdk");
  const { validateEnvelope } = require("../lib/attestation");
  const {
    registerEvidence,
    registrationStatus,
  } = require("../lib/registration");
  const { verifyImage } = require("../lib/verification");
  const issuer = hre.ethers.Wallet.createRandom();
  process.env.ZORAI_ISSUERS_JSON = JSON.stringify([
    {
      id: "test-studio",
      active: true,
      address: issuer.address,
      sources: ["local-fixture"],
    },
  ]);
  const prepared = await prepareRegistration({
    bytes: png(),
    signer: issuer,
    issuerId: "test-studio",
    source: "local-fixture",
    model: "test-model",
    chainId: 31337,
    registryAddress: await registry.getAddress(),
  });
  validateEnvelope(prepared.evidence, { fresh: true });
  const client = { id: "local-publisher" };
  const job = await registerEvidence(prepared.evidence, client);
  assert.equal(job.status, "submitted");
  assert.match(job.txHash, /^0x[0-9a-f]{64}$/);
  assert.equal(await registry.getTotalImages(), 0n);
  const repeat = await registerEvidence(prepared.evidence, client);
  assert.equal(repeat.status, "confirmed");
  assert.equal(repeat.txHash, job.txHash);
  assert.equal(pins, 1);
  assert.equal(await registry.getTotalImages(), 1n);
  const duplicate = await registerEvidence(prepared.evidence, client);
  assert.equal(duplicate.txHash, job.txHash);
  assert.equal(pins, 1);
  const status = await registrationStatus(
    prepared.evidence.claim.imageHash,
    client,
  );
  assert.equal(status.status, "confirmed");
  await assert.rejects(
    () =>
      registrationStatus(prepared.evidence.claim.imageHash, { id: "other" }),
    /belongs/,
  );
  const result = await verifyImage(prepared.evidence.claim.imageHash);
  assert.equal(result.status, "attested");
  assert.equal(result.issuer.address, issuer.address);
  const unknown = await verifyImage("f".repeat(64));
  assert.equal(unknown.isAiGenerated, null);
  const cid = job.evidenceCid;
  const forged = evidence.get(cid);
  forged.claim.model = "forged";
  evidence.set(cid, forged);
  const tampered = await verifyImage(prepared.evidence.claim.imageHash);
  assert.equal(tampered.isAiGenerated, null);
  console.log(
    "Integration passed: prepare → sign → persist → real EVM receipt → verify; idempotent retry, account isolation, unknown and forged evidence.",
  );
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
