const crypto = require("crypto");
const { assert, ApiError } = require("./api");
const { consume, getStore, namespace } = require("./store");

function configList(name) {
  let entries;
  try {
    entries = JSON.parse(process.env[name] || "[]");
  } catch {
    throw new ApiError(
      503,
      "invalid_configuration",
      "Service access configuration needs operator attention.",
    );
  }
  assert(
    Array.isArray(entries),
    503,
    "invalid_configuration",
    "Service access configuration needs operator attention.",
  );
  return entries;
}
function digest(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
function credentials(req) {
  const bearer =
    typeof req.headers.authorization === "string" &&
    req.headers.authorization.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;
  const key = req.headers["x-api-key"];
  assert(
    !(bearer && key && bearer !== key),
    401,
    "invalid_api_key",
    "Conflicting API credentials.",
  );
  const token = bearer || key;
  assert(
    typeof token === "string" && token.length >= 32 && token.length <= 256,
    401,
    "invalid_api_key",
    "A valid API key is required.",
  );
  return token;
}
async function authenticate(req, scope) {
  const hashed = digest(credentials(req));
  const clients = configList("ZORAI_CLIENTS_JSON");
  const client = clients.find(
    (entry) =>
      typeof entry.keyHash === "string" &&
      /^[a-f0-9]{64}$/.test(entry.keyHash) &&
      crypto.timingSafeEqual(
        Buffer.from(entry.keyHash, "hex"),
        Buffer.from(hashed, "hex"),
      ),
  );
  assert(
    client &&
      client.active === true &&
      (!client.expiresAt || Date.parse(client.expiresAt) > Date.now()),
    401,
    "invalid_api_key",
    "The API key is invalid, inactive, or expired.",
  );
  assert(
    /^[a-zA-Z0-9_-]{1,64}$/.test(client.id) &&
      Number.isSafeInteger(client.monthlyLimit) &&
      client.monthlyLimit > 0,
    503,
    "invalid_configuration",
    "The account plan needs operator attention.",
  );
  assert(
    Array.isArray(client.scopes) && client.scopes.includes(scope),
    403,
    "scope_required",
    "This API key does not have the required permission.",
  );
  await consume(
    "zorai:burst:" + client.id + ":" + Math.floor(Date.now() / 60000),
    120,
    120,
  );
  return client;
}
function period() {
  const now = new Date();
  const reset = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  return {
    month: now.toISOString().slice(0, 7),
    reset: reset.toISOString(),
    ttl: Math.ceil((reset.getTime() - now.getTime()) / 1000) + 86400,
  };
}
async function reserveVerification(client) {
  const p = period();
  const key = "zorai:usage:" + client.id + ":" + p.month;
  const used = await consume(key, client.monthlyLimit, p.ttl);
  return {
    key,
    used,
    limit: client.monthlyLimit,
    remaining: client.monthlyLimit - used,
    resetsAt: p.reset,
  };
}
async function usage(client) {
  const p = period();
  const used = Number(
    (await getStore().get(
      namespace() + "zorai:usage:" + client.id + ":" + p.month,
    )) || 0,
  );
  return {
    used,
    limit: client.monthlyLimit,
    remaining: Math.max(0, client.monthlyLimit - used),
    resetsAt: p.reset,
  };
}
async function publicLimit(req) {
  // Only trust forwarding information supplied by Vercel; self-hosted deployments use the socket address.
  const ip =
    process.env.VERCEL === "1"
      ? req.headers["x-vercel-forwarded-for"]
      : req.socket?.remoteAddress;
  assert(
    typeof ip === "string" && ip.length < 256,
    503,
    "client_identity_unavailable",
    "Public verification is temporarily unavailable.",
  );
  const bucket = Math.floor(Date.now() / 60000);
  await consume("zorai:public:" + digest(ip) + ":" + bucket, 6, 120);
  await consume(
    "zorai:public-total:" + new Date().toISOString().slice(0, 10),
    5000,
    172800,
  );
}
module.exports = {
  configList,
  digest,
  authenticate,
  reserveVerification,
  usage,
  publicLimit,
};
