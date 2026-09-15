const { deflateSync } = require("zlib");
const { pngChunk } = require("../lib/assets");
function png(extra = []) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1);
  header.writeUInt32BE(1, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    ...extra,
    pngChunk("IDAT", deflateSync(Buffer.from([0, 120, 150, 180]))),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}
// Test double only. Production always requires Redis. Clone values as a remote store would.
function memoryStore() {
  const values = new Map();
  const store = {
    async get(key) {
      return values.has(key) ? structuredClone(values.get(key)) : null;
    },
    async set(key, value, options = {}) {
      if (options.nx && values.has(key)) return null;
      values.set(key, structuredClone(value));
      return "OK";
    },
    async eval(script, keys, args) {
      const key = keys[0],
        value = values.get(key);
      if (script.includes("'DEL'")) {
        if (value === args[0]) {
          values.delete(key);
          return 1;
        }
        return 0;
      }
      if (script.includes("'DECR'")) {
        const n = Math.max(0, Number(value || 0) - 1);
        values.set(key, n);
        return n;
      }
      if (script.includes("'INCR'")) {
        const n = Number(value || 0);
        if (n >= Number(args[0])) return -1;
        values.set(key, n + 1);
        return n + 1;
      }
      throw new Error("Unsupported test script");
    },
    multi() {
      const pending = [];
      const tx = {
        set(key, value) {
          pending.push([key, value]);
          return tx;
        },
        async exec() {
          for (const [key, value] of pending) await store.set(key, value);
          return pending.map(() => "OK");
        },
      };
      return tx;
    },
    clear() {
      values.clear();
    },
  };
  return store;
}
module.exports = { png, memoryStore };
