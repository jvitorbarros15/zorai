import { createMocks } from "node-mocks-http";
import handler from "../../pages/api/verify";
import publicHandler from "../../pages/api/public/verify";
import { ApiError } from "../../lib/api";
jest.mock("../../lib/store", () => ({
  consume: jest.fn(),
  refund: jest.fn(),
  getStore: jest.fn(),
  namespace: () => "test:",
}));
jest.mock("../../lib/verification", () => ({ verifyImage: jest.fn() }));
const { consume, refund } = require("../../lib/store");
const { verifyImage } = require("../../lib/verification");
const { digest } = require("../../lib/access");
const { png } = require("../../test-support/fixtures.cjs");
const token = "test_" + "k".repeat(40),
  imageHash = "a".repeat(64);
async function call(
  body = { imageHash },
  headers = { authorization: "Bearer " + token },
  route = handler,
) {
  const { req, res } = createMocks({
    method: "POST",
    headers,
    body,
    socket: { remoteAddress: "127.0.0.1" },
  });
  await route(req, res);
  return res;
}
beforeEach(() => {
  jest.resetAllMocks();
  consume.mockResolvedValue(1);
  process.env.ZORAI_CLIENTS_JSON = JSON.stringify([
    {
      id: "buyer",
      keyHash: digest(token),
      active: true,
      scopes: ["verify"],
      monthlyLimit: 10,
    },
  ]);
  verifyImage.mockResolvedValue({
    status: "unknown",
    isAiGenerated: null,
    imageHash,
  });
});
test("missing credentials fail before quota or registry work", async () => {
  expect((await call({ imageHash }, {})).statusCode).toBe(401);
  expect(consume).not.toHaveBeenCalled();
  expect(verifyImage).not.toHaveBeenCalled();
});
test("conflicting credentials are rejected", async () => {
  expect(
    (
      await call(
        { imageHash },
        { authorization: "Bearer " + token, "x-api-key": "z".repeat(40) },
      )
    ).statusCode,
  ).toBe(401);
});
test("disabled and expired keys are rejected", async () => {
  for (const change of [{ active: false }, { expiresAt: "2020-01-01" }]) {
    const config = JSON.parse(process.env.ZORAI_CLIENTS_JSON);
    Object.assign(config[0], change);
    process.env.ZORAI_CLIENTS_JSON = JSON.stringify(config);
    expect((await call()).statusCode).toBe(401);
  }
});
test("invalid hashes are rejected before monthly usage reservation", async () => {
  expect((await call({ imageHash: "bad" })).statusCode).toBe(400);
  expect(consume).toHaveBeenCalledTimes(1);
  expect(verifyImage).not.toHaveBeenCalled();
});
test("unknown results remain inconclusive and consume one request", async () => {
  const res = await call();
  expect(res.statusCode).toBe(200);
  expect(res._getJSONData()).toMatchObject({
    status: "unknown",
    isAiGenerated: null,
    usage: { remaining: 9 },
  });
  expect(refund).not.toHaveBeenCalled();
});
test("monthly quota blocks RPC work", async () => {
  consume
    .mockResolvedValueOnce(1)
    .mockRejectedValueOnce(
      new ApiError(429, "quota_exceeded", "Quota reached"),
    );
  expect((await call()).statusCode).toBe(429);
  expect(verifyImage).not.toHaveBeenCalled();
});
test("RPC failure returns 503 and refunds monthly usage", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  verifyImage.mockRejectedValue(new Error("private RPC detail"));
  const res = await call();
  expect(res.statusCode).toBe(503);
  expect(res._getJSONData().error.message).not.toContain("private");
  expect(refund).toHaveBeenCalledTimes(1);
  log.mockRestore();
});
test("uploaded file and supplied hash must match", async () => {
  expect(
    (await call({ imageHash, assetBase64: png().toString("base64") }))
      .statusCode,
  ).toBe(400);
  expect(verifyImage).not.toHaveBeenCalled();
});
test("file inspection does not classify unsigned metadata as AI", async () => {
  const res = await call({ assetBase64: png().toString("base64") });
  expect(res.statusCode).toBe(200);
  expect(res._getJSONData()).toMatchObject({
    isAiGenerated: null,
    inspection: { format: "png", marker: null },
  });
});
test("legacy watermark assertions cannot bypass evidence verification", async () => {
  expect((await call({ imageHash, watermark: { imageHash } })).statusCode).toBe(
    400,
  );
});
test("public route is bounded and accepts only a digest", async () => {
  delete process.env.VERCEL;
  const res = await call({ imageHash }, {}, publicHandler);
  expect(res.statusCode).toBe(200);
  expect(consume).toHaveBeenCalledTimes(2);
  expect(
    (await call({ assetBase64: png().toString("base64") }, {}, publicHandler))
      .statusCode,
  ).toBe(400);
});
