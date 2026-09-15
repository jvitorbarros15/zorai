const { inspectAsset, prepareAsset, sha256 } = require("../lib/assets");
// Real 1x1 JPEG generated from a solid RGB pixel, with no external image content.
const original = Buffer.from(
  "/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAABf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKoBcY//2Q==",
  "base64",
);
test("JPEG XMP marker round trip preserves the original segment bytes", () => {
  const marker = { version: 1, issuerId: "studio", nonce: "test-nonce" };
  const prepared = prepareAsset(original, marker);
  const info = inspectAsset(prepared);
  expect(info.format).toBe("jpeg");
  expect(info.marker).toEqual(marker);
  expect(info.imageHash).toBe(sha256(prepared));
  const addedLength = prepared.length - original.length;
  expect(prepared.subarray(2 + addedLength)).toEqual(original.subarray(2));
});
test("truncated JPEG cannot be prepared or inspected", () => {
  expect(() => inspectAsset(original.subarray(0, -2))).toThrow(/Incomplete/);
});
test("real JPEG can be inspected multiple times without error", () => {
  const info1 = inspectAsset(original);
  expect(info1.format).toBe("jpeg");
  const info2 = inspectAsset(original);
  expect(info2.format).toBe("jpeg");
  expect(info1.imageHash).toBe(info2.imageHash);
});
test("JPEG with APP0 JFIF first keeps APP0 at offset 2 and XMP after", () => {
  const marker = { version: 1, issuerId: "studio", nonce: "test-nonce" };
  const soi = Buffer.from([0xff, 0xd8]);
  const app0 = Buffer.from([
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00,
    0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  ]);
  const sof = Buffer.from([
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11,
    0x00,
  ]);
  const sos = Buffer.from([
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x3f, 0x00,
  ]);
  const eoi = Buffer.from([0xff, 0xd9]);
  const testJpeg = Buffer.concat([
    soi,
    app0,
    sof,
    sos,
    Buffer.from([0xd3]),
    eoi,
  ]);
  const prepared = prepareAsset(testJpeg, marker);
  const info = inspectAsset(prepared);
  expect(info.format).toBe("jpeg");
  expect(info.marker).toEqual(marker);
  expect(prepared[0]).toBe(0xff);
  expect(prepared[1]).toBe(0xd8);
  expect(prepared[2]).toBe(0xff);
  expect(prepared[3]).toBe(0xe0);
  const xmpStart = prepared.indexOf(Buffer.from([0xff, 0xe1]));
  expect(xmpStart).toBe(2 + app0.length);
});
test("JPEG with FF FF fill byte before segment is handled", () => {
  const soi = Buffer.from([0xff, 0xd8]);
  const fillBytes = Buffer.from([0xff, 0xff]);
  const sof = Buffer.from([
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11,
    0x00,
  ]);
  const sos = Buffer.from([
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x3f, 0x00,
  ]);
  const eoi = Buffer.from([0xff, 0xd9]);
  const testJpeg = Buffer.concat([
    soi,
    fillBytes,
    sof,
    sos,
    Buffer.from([0xd3]),
    eoi,
  ]);
  const info = inspectAsset(testJpeg);
  expect(info.format).toBe("jpeg");
  expect(info.insertionOffset).toBe(2);
});
