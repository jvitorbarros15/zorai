const { boundedJson, readEvidence } = require('../lib/ipfs');
test('evidence parser limits response size', async () => {
  await expect(boundedJson(new Response('x'.repeat(100)), 10)).rejects.toMatchObject({code:'invalid_evidence'});
});
test('invalid JSON is distinct from an unavailable gateway', async () => {
  await expect(boundedJson(new Response('not json'))).rejects.toMatchObject({code:'invalid_evidence'});
  await expect(boundedJson(new Response('{}',{status:503}))).rejects.toMatchObject({code:'storage_unavailable'});
});
test('a registry value cannot cause an arbitrary URL fetch', async () => {
  const fetcher=jest.spyOn(global,'fetch');
  await expect(readEvidence('http://127.0.0.1/private')).rejects.toMatchObject({code:'legacy_record'});
  expect(fetcher).not.toHaveBeenCalled();fetcher.mockRestore();
});
