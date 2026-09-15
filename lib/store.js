const { Redis } = require("@upstash/redis");
const { ApiError, assert } = require("./api");
let redis;
function namespace() {
  const { registryConfig } = require("./zoraiRegistry");
  const config = registryConfig();
  return "zorai:" + config.chainId + ":" + config.address.toLowerCase() + ":";
}
function getStore() {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    throw new ApiError(
      503,
      "storage_unavailable",
      "API usage and registration storage is not configured.",
    );
  }
  if (!redis)
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      automaticDeserialization: true,
      retry: { retries: 1, backoff: () => 100 },
    });
  return redis;
}
async function consume(key, limit, seconds) {
  const count = Number(
    await getStore().eval(
      "local n=tonumber(redis.call('GET',KEYS[1]) or '0'); if n>=tonumber(ARGV[1]) then return -1 end; n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[2]) end; return n",
      [namespace() + key],
      [limit, seconds],
    ),
  );
  if (count === -1)
    throw new ApiError(
      429,
      "quota_exceeded",
      "This usage limit has been reached. Check your plan or retry after the reset.",
    );
  assert(
    Number.isSafeInteger(count) && count > 0 && count <= limit,
    503,
    "usage_unavailable",
    "Usage storage returned an invalid result.",
  );
  return count;
}
async function refund(key) {
  await getStore().eval(
    "local n=tonumber(redis.call('GET',KEYS[1]) or '0'); if n>0 then return redis.call('DECR',KEYS[1]) end; return 0",
    [namespace() + key],
    [],
  );
}
module.exports = { getStore, consume, refund, namespace };
