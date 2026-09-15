const { inspectAsset, prepareAsset, sha256 } = require('../lib/assets');
// Real 1x1 JPEG generated from a solid RGB pixel, with no external image content.
const original = Buffer.from('/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAABf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKoBcY//2Q==', 'base64');
test('JPEG XMP marker round trip preserves the original segment bytes', () => {
  const marker = { version: 1, issuerId: 'studio', nonce: 'test-nonce' };
  const prepared = prepareAsset(original, marker);
  const info = inspectAsset(prepared);
  expect(info.format).toBe('jpeg'); expect(info.marker).toEqual(marker);
  expect(info.imageHash).toBe(sha256(prepared));
  const addedLength = prepared.length - original.length;
  expect(prepared.subarray(2 + addedLength)).toEqual(original.subarray(2));
});
test('truncated JPEG cannot be prepared or inspected', () => {
  expect(() => inspectAsset(original.subarray(0, -2))).toThrow(/Incomplete/);
});
