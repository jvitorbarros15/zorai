import { createMocks } from "node-mocks-http";
import { route } from "../lib/api";

test("5xx errors log with secret redaction", async () => {
  const handler = route(["POST"], async () => {
    throw new Error("boom https://secret-rpc");
  });
  process.env.ZORAI_RPC_URL = "https://secret-rpc";
  const consoleSpy = jest.spyOn(console, "error").mockImplementation();
  const { req, res } = createMocks({ method: "POST" });
  await handler(req, res);
  expect(consoleSpy).toHaveBeenCalled();
  const logged = consoleSpy.mock.calls[0][0];
  const obj = JSON.parse(logged);
  expect(obj.message).toContain("boom");
  expect(obj.message).toContain("[redacted]");
  expect(obj.message).not.toContain("secret-rpc");
  expect(res.statusCode).toBe(503);
  expect(res._getJSONData().error.code).toBe("service_unavailable");
  consoleSpy.mockRestore();
  delete process.env.ZORAI_RPC_URL;
});
