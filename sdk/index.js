const { randomUUID } = require("crypto");
const { prepareAsset, sha256 } = require("../lib/assets");
const { TYPES } = require("../lib/attestation");

async function prepareRegistration({
  bytes,
  signer,
  issuerId,
  source,
  model,
  chainId,
  registryAddress,
}) {
  const nonce = randomUUID();
  const prepared = prepareAsset(bytes, { version: 1, issuerId, nonce });
  const domain = {
    name: "ZorAI Provenance",
    version: "1",
    chainId,
    verifyingContract: registryAddress,
  };
  const claim = {
    imageHash: sha256(prepared),
    issuerId,
    source,
    model,
    issuedAt: Math.floor(Date.now() / 1000),
    nonce,
  };
  const signature = await signer.signTypedData(domain, TYPES, claim);
  return {
    bytes: prepared,
    evidence: {
      version: 1,
      kind: "issuer_attestation",
      domain,
      claim,
      signature,
    },
  };
}
class ZorAIClient {
  constructor({ baseUrl, apiKey }) {
    const url = new URL(baseUrl);
    if (
      url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      )
    )
      throw new Error("Use HTTPS for API credentials.");
    if (url.username || url.password || url.search || url.hash)
      throw new Error("Use a base URL without credentials, query or fragment.");
    this.baseUrl = url.origin;
    this.apiKey = apiKey;
  }
  async request(path, body) {
    const response = await fetch(this.baseUrl + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Authorization: "Bearer " + this.apiKey,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "error",
      signal: AbortSignal.timeout(65000),
    });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error?.message || "ZorAI request failed");
      error.status = response.status;
      error.code = data.error?.code;
      error.requestId = data.requestId;
      throw error;
    }
    return data;
  }
  verify(imageHash) {
    return this.request("/api/verify", { imageHash });
  }
  verifyFile(bytes) {
    return this.request("/api/verify", {
      assetBase64: Buffer.from(bytes).toString("base64"),
    });
  }
  register(prepared) {
    return this.request("/api/register", {
      assetBase64: prepared.bytes.toString("base64"),
      evidence: prepared.evidence,
    });
  }
  registration(imageHash) {
    return this.request(
      "/api/registration?id=" + encodeURIComponent(imageHash),
    );
  }
  account() {
    return this.request("/api/account");
  }
}
module.exports = { prepareRegistration, ZorAIClient };
