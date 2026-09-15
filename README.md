# ZorAI

A verification API and public checker for signed AI-image provenance. Businesses buy verification access; approved source integrations publish accountable claims to a public registry.

**Stage: pilot implementation, not a production commercial launch.** Direct Midjourney, Sora and OpenAI integrations, independent C2PA validation and self-service billing are not connected. See [launch readiness](LAUNCH_READINESS.md) and [issue tracker #16](https://github.com/jvitorbarros15/zorai/issues/16).

## What verification means

An `attested` result means an approved issuer signed a claim matching the exact final file digest and registry entry. Missing, invalid or unsupported evidence returns an unknown origin (`isAiGenerated: null`). This does not classify arbitrary internet images or prove that a depicted event happened.

The metadata marker is editable. Trust comes from an approved source identity and signature bound to the file, not a model name in EXIF. Resizing, recompression or stripping metadata changes the digest.

## Run locally

Use **Node 22** (`.nvmrc`). The Pages Router app uses Next.js 15 and React 18.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Pages render with empty configuration. Verification requires a deployed registry, an RPC endpoint and Upstash Redis. Registration additionally needs an approved service signer, Pinata JWT and an approved issuer identity. Missing services return explicit errors; no simulated transactions or in-memory production fallback exist.

Never expose server credentials using `NEXT_PUBLIC_` variables. Only the contract address is public. Configure staging and production independently, including Redis credentials and issuer policy. Redis keys are additionally namespaced by chain and registry.

## API

| Endpoint | Access | Purpose |
| --- | --- | --- |
| `POST /api/verify` | `verify` scope | Verify `imageHash` or inspect/verify PNG/JPEG `assetBase64` (3 MB maximum) |
| `GET /api/verify?id=SHA256` | `verify` scope | Exact digest verification |
| `GET /api/account` | `verify` scope | Account and monthly usage |
| `POST /api/register` | `register` scope + approved issuer signature | Submit final bytes and signed evidence |
| `GET /api/registration?id=SHA256` | Same registering account | Poll persisted transaction status |
| `POST /api/public/verify` | Public, bounded | Hash-only interactive lookup |
| `GET /api/status` | Public | Configuration summary, not dependency health |

Send `Authorization: Bearer YOUR_KEY`. Completed verification lookups, including unknown results, consume one monthly unit. Invalid inputs do not consume monthly units. Dependency failures attempt a refund; a failed refund requires reconciliation. Burst limits apply separately. Unknown provenance is HTTP 200. Errors have `{error: {code, message}, requestId}`.

Use `/docs` in the application for full guidance or [OpenAPI](public/openapi.json). The [Node SDK](sdk/index.js) is repository-local, not published to npm. The [API console](pages/connect.js) keeps keys in page memory only.

## Approved source workflow

1. Approve the organization's identity, controlled generation process, signing address and allowed source identifiers. A random wallet is not proof of provider identity.
2. `prepareRegistration` inserts `{version:1, issuerId, nonce}` in PNG tEXt or JPEG XMP before hashing the final bytes.
3. The issuer signs an EIP-712 claim binding the final digest, issuer, source, model, timestamp and nonce to the chain and registry address.
4. The server checks the signed evidence, account issuer binding, metadata marker and actual uploaded bytes.
5. Evidence is pinned to IPFS. A signed registry transaction is persisted before broadcast. The caller receives a real transaction hash and polls for a confirmed receipt.
6. Publish the prepared bytes unchanged only after confirmation. Public readers can inspect the contract and signed evidence.

Existing source C2PA credentials are not validated by this implementation. The preparation helper rejects recognized credentials instead of rewriting them. This custom marker is not a C2PA credential or a robust invisible watermark. Do not approve a live C2PA source until credential-preserving ingestion is implemented.

Only public evidence, not original image bytes, is pinned. Published claims must contain no private prompts or personal information. Chain records and IPFS evidence cannot be reliably erased.

## Controlled customer provisioning

```sh
node scripts/create-api-client.cjs customer_id 1000
```

Run in a trusted local terminal: output includes a new secret and an **inactive** hashed configuration. Deliver the key securely; add the configuration to `ZORAI_CLIENTS_JSON` and activate it only after onboarding and commercial terms. Use an expiry for pilots. Verification-only accounts cannot register. Issuer accounts additionally require `issuerId`, `register` scope and `dailyRegistrationLimit`.

These are manually provisioned plans. No payment has been collected by this application; checkout, invoices, tax handling and entitlement synchronization remain launch work. See [operations](OPERATIONS.md).

## Validation

```sh
npm run lint
npm run test:api
npm run test:contracts
npm run test:integration
npm run build
npm audit --omit=dev
```

The integration test deploys the real Solidity contract on an ephemeral local EVM, prepares/signs bytes, persists and broadcasts a transaction, checks a receipt and verifies the evidence. Redis and IPFS are explicit test doubles; this does not prove deployed infrastructure readiness. The tests never spend funds or generate paid images.

The contract changes require a **new deployment**. The historical Base Sepolia address is not upgraded by changing this repository. Before changing production configuration, complete the release gates and independent contract review. Never share a publisher signer with other transaction-writing services; this pilot serializes that signer with a durable pending job.

Next's transitive PostCSS dependency is overridden to the patched version declared in `package.json`; revisit this override during framework updates. Commit `package-lock.json` and use `npm ci` in CI.

## Project structure

- `pages/`: public checker, API console, docs, provider information and API handlers.
- `lib/`: authentication, quotas, image metadata, signatures, evidence storage and registry jobs.
- `sdk/`: source preparation and authenticated Node client.
- `contracts/`: Solidity source and ABI; `test/`: contract tests.
- `__tests__/`: API and provenance tests; `scripts/integration-test.cjs`: local chain round trip.
- `discovery/`: local product discovery, intentionally ignored by Git.

The old generator, prompt analyzer, shared chat history, unrestricted URL upload and environment probe endpoints return 410.
