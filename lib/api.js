const crypto = require("crypto");

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
function assert(condition, status, code, message) {
  if (!condition) throw new ApiError(status, code, message);
}
function object(value) {
  assert(
    value && typeof value === "object" && !Array.isArray(value),
    400,
    "invalid_body",
    "A JSON object is required.",
  );
  return value;
}
function hash(value) {
  assert(
    typeof value === "string" && /^[a-fA-F0-9]{64}$/.test(value),
    400,
    "invalid_hash",
    "Use the 64-character SHA-256 digest of the final file.",
  );
  return value.toLowerCase();
}
function route(methods, handler) {
  return async (req, res) => {
    const requestId = crypto.randomUUID();
    res.setHeader("X-Request-Id", requestId);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (!methods.includes(req.method)) {
      res.setHeader("Allow", methods.join(", "));
      return res
        .status(405)
        .json({
          error: { code: "method_not_allowed", message: "Method not allowed." },
          requestId,
        });
    }
    try {
      await handler(req, res);
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 503;
      if (status >= 500)
        console.error(
          JSON.stringify({
            requestId,
            code: error.code || "dependency_unavailable",
            status,
          }),
        );
      if (status === 429) res.setHeader("Retry-After", "60");
      res.status(status).json({
        error: {
          code: error instanceof ApiError ? error.code : "service_unavailable",
          message:
            error instanceof ApiError
              ? error.message
              : "Verification services are temporarily unavailable. Please retry.",
        },
        requestId,
      });
    }
  };
}
module.exports = { ApiError, assert, object, hash, route };
