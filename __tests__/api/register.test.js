import { createMocks } from "node-mocks-http";
import handler from "../../pages/api/register";
jest.mock("../../lib/store", () => ({
  consume: jest.fn(),
  refund: jest.fn(),
  getStore: jest.fn(),
  namespace: () => "test:",
}));
jest.mock("../../lib/registration", () => ({ registerEvidence: jest.fn() }));
const { ethers } = require("ethers");
const { digest } = require("../../lib/access");
const { consume, refund } = require("../../lib/store");
const { registerEvidence } = require("../../lib/registration");
const { prepareRegistration } = require("../../sdk");
const { png } = require("../../test-support/fixtures.cjs");
const token = "issuer_" + "k".repeat(40);
let prepared, issuer;
async function call(body, headers = { authorization: "Bearer " + token }) {
  const { req, res } = createMocks({ method: "POST", headers, body });
  await handler(req, res);
  return res;
}
beforeEach(async () => {
  jest.resetAllMocks();
  consume.mockResolvedValue(1);
  refund.mockResolvedValue(undefined);
  issuer = ethers.Wallet.createRandom();
  process.env.ZORAI_CHAIN_ID = "31337";
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS =
    ethers.Wallet.createRandom().address;
  process.env.ZORAI_ISSUERS_JSON = JSON.stringify([
    {
      id: "studio",
      active: true,
      address: issuer.address,
      sources: ["controlled-source"],
    },
  ]);
  process.env.ZORAI_CLIENTS_JSON = JSON.stringify([
    {
      id: "publisher",
      keyHash: digest(token),
      active: true,
      scopes: ["register"],
      issuerId: "studio",
      monthlyLimit: 10,
      dailyRegistrationLimit: 10,
    },
  ]);
  prepared = await prepareRegistration({
    bytes: png(),
    signer: issuer,
    issuerId: "studio",
    source: "controlled-source",
    model: "test-model",
    chainId: 31337,
    registryAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  });
  registerEvidence.mockResolvedValue({
    job: { status: "submitted", txHash: "0xreal" },
    created: true,
  });
});
function body() {
  return {
    assetBase64: prepared.bytes.toString("base64"),
    evidence: prepared.evidence,
  };
}
test("anonymous publishing is rejected", async () => {
  expect((await call(body(), {})).statusCode).toBe(401);
  expect(registerEvidence).not.toHaveBeenCalled();
});
test("self-declared model and hash cannot create a record", async () => {
  expect(
    (await call({ imageHash: "a".repeat(64), modelUsed: "OpenAI" })).statusCode,
  ).toBe(400);
  expect(registerEvidence).not.toHaveBeenCalled();
});
test("a verification customer cannot publish", async () => {
  const config = JSON.parse(process.env.ZORAI_CLIENTS_JSON);
  config[0].scopes = ["verify"];
  process.env.ZORAI_CLIENTS_JSON = JSON.stringify(config);
  expect((await call(body())).statusCode).toBe(403);
});
test("changed signed claims fail before publication", async () => {
  prepared.evidence.claim.model = "forged";
  expect((await call(body())).statusCode).toBe(422);
  expect(registerEvidence).not.toHaveBeenCalled();
});
test("unsigned original bytes cannot replace the marked asset", async () => {
  expect(
    (await call({ ...body(), assetBase64: png().toString("base64") }))
      .statusCode,
  ).toBe(422);
  expect(registerEvidence).not.toHaveBeenCalled();
});
test("pending transaction is not reported as confirmed", async () => {
  const res = await call(body());
  expect(res.statusCode).toBe(202);
  expect(res._getJSONData().status).toBe("submitted");
});
test("confirmed receipt returns 200", async () => {
  registerEvidence.mockResolvedValue({
    job: { status: "confirmed" },
    created: false,
  });
  expect((await call(body())).statusCode).toBe(200);
});
test("failed transaction returns conflict", async () => {
  registerEvidence.mockResolvedValue({
    job: { status: "failed" },
    created: false,
  });
  expect((await call(body())).statusCode).toBe(409);
});
test("dropped transaction returns conflict", async () => {
  registerEvidence.mockResolvedValue({
    job: { status: "dropped" },
    created: false,
  });
  expect((await call(body())).statusCode).toBe(409);
});
test("refund called when registerEvidence rejects", async () => {
  const error = new Error("publisher_busy");
  error.code = "publisher_busy";
  error.status = 409;
  registerEvidence.mockRejectedValue(error);
  await expect(call(body())).resolves.toBeDefined();
  expect(refund).toHaveBeenCalled();
});
test("refund called when created is false", async () => {
  registerEvidence.mockResolvedValue({
    job: { status: "submitted" },
    created: false,
  });
  await call(body());
  expect(refund).toHaveBeenCalled();
});
test("refund not called when created is true", async () => {
  registerEvidence.mockResolvedValue({
    job: { status: "submitted" },
    created: true,
  });
  await call(body());
  expect(refund).not.toHaveBeenCalled();
});
