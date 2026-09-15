const { ethers } = require("ethers");
const { assert } = require("./api");
const Registry = require("../contracts/ZorAiRegistry.json");
let provider, providerKey;
function registryConfig() {
  const chainId = Number(process.env.ZORAI_CHAIN_ID || 84532);
  const networks = {
    84532: [
      "Base Sepolia",
      "https://sepolia.basescan.org",
      "https://sepolia.base.org",
    ],
    8453: ["Base", "https://basescan.org", "https://mainnet.base.org"],
    31337: ["Local test chain", "", "http://127.0.0.1:8545"],
  };
  assert(
    networks[chainId],
    503,
    "registry_unconfigured",
    "Unsupported registry network.",
  );
  const [name, explorer, defaultRpc] = networks[chainId];
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  assert(
    ethers.isAddress(address),
    503,
    "registry_unconfigured",
    "The registry address is not configured.",
  );
  return {
    chainId,
    name,
    explorer,
    address,
    testnet: chainId !== 8453,
    rpc: process.env.ZORAI_RPC_URL || defaultRpc,
  };
}
function getReadProvider() {
  const config = registryConfig(),
    key = config.rpc + ":" + config.chainId;
  if (!provider || providerKey !== key) {
    if (provider) provider.destroy();
    const connection = new ethers.FetchRequest(config.rpc);
    connection.timeout = 12000;
    provider = new ethers.JsonRpcProvider(connection, config.chainId, {
      batchMaxCount: 1,
    });
    providerKey = key;
  }
  return provider;
}
function getReadContract() {
  return new ethers.Contract(
    registryConfig().address,
    Registry.abi,
    getReadProvider(),
  );
}
function getWriteContract() {
  assert(
    /^0x[a-fA-F0-9]{64}$/.test(process.env.ZORAI_SIGNER_PRIVATE_KEY || ""),
    503,
    "signer_unconfigured",
    "Registry publishing is not configured.",
  );
  return new ethers.Contract(
    registryConfig().address,
    Registry.abi,
    new ethers.Wallet(process.env.ZORAI_SIGNER_PRIVATE_KEY, getReadProvider()),
  );
}
async function readRecord(imageHash) {
  const contract = getReadContract();
  if (!(await contract.isImageRegistered(imageHash))) return null;
  const data = await contract.getImageData(imageHash);
  return {
    imageHash,
    evidenceCid: data[0],
    model: data[1],
    registrar: data[2],
    registeredAt: new Date(Number(data[3]) * 1000).toISOString(),
  };
}
function publicNetwork() {
  const { chainId, name, explorer, address, testnet } = registryConfig();
  return { chainId, name, explorer, contract: address, testnet };
}
module.exports = {
  registryConfig,
  getReadProvider,
  getReadContract,
  getWriteContract,
  readRecord,
  publicNetwork,
};
