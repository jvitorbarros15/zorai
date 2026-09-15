# Pilot operations

## Configuration and separation

Use Node 22 and the committed lockfile. Build without funded credentials. Configure the environment from `.env.example` on the intended deployment; use a secrets manager. The public contract address must correspond to the selected chain and reviewed contract. RPC endpoints must target that same chain. Use different signers, Redis credentials and issuer/client configurations for staging and production.

`ZORAI_CLIENTS_JSON` stores hashes of cryptographically random keys, scopes, an active flag, monthly limit, optional expiry and an account ID. Reuse an account ID during key rotation to preserve usage. A key with register scope also needs an approved issuerId and dailyRegistrationLimit. Do not put raw API keys into JSON configuration. Revocation is performed by disabling the key and updating the deployment environment; confirm the change has propagated.

`ZORAI_ISSUERS_JSON` is the operator's trust policy. Validate identity and source capture before approval. Disabling an issuer causes future verification of its records to return unknown. Preserve a private audit record of approvals and revocations; this configuration is not itself a public trust registry.

The public checker uses `x-vercel-forwarded-for` only on Vercel and the socket IP elsewhere. Validate hosting behavior in staging. Self-hosting behind another proxy requires a reviewed trusted-proxy configuration; blindly trusting client-supplied forwarding headers bypasses limits. Apply host-level body limits and abuse protection before launch.

## Registration recovery

Redis keys include chain and registry. `registration:DIGEST` contains the account ID, request fingerprint, envelope, evidence CID and signed transaction. `signer-pending` identifies the sole outstanding transaction. The lock has a bounded TTL; pending state has no automatic expiry.

1. Poll `/api/registration?id=DIGEST` using the original registering account.
2. For an uncertain broadcast, retry the **identical** signed request while its claim is fresh. The persisted raw transaction is rebroadcast, preserving its nonce and hash. Inspect the original transaction on the correct explorer.
3. Stuck policy: after `ZORAI_STUCK_TX_SECONDS` (default 600) a retry under the lock replaces the transaction with the same nonce and +25% fees; if the nonce was consumed by another transaction and no known hash mined, the job becomes `dropped` (or `confirmed` if the record exists on chain) and the queue is released. Status polling never signs.
4. Failed/dropped jobs: an identical request returns the terminal job; a newly signed claim for the same digest archives the old job (90-day TTL) and starts a new attempt.
5. Ownership: `acceptOwnership` revokes the previous owner's issuer rights. Never make the service signer the owner; if it is, re-add it with `addIssuer` right after transfer, or `/api/register` returns `registrar_not_authorized`.
6. If the evidence was pinned but no transaction was persisted, retry may leave an orphan pin. Review and remove unreferenced pins under the retention policy.

The current receipt policy is one mined receipt, with later polling able to update a job. There is no completed production reorg/finality policy or autonomous reconciliation worker. These are launch gates.

## Usage and commercial reconciliation

Redis atomically reserves a monthly verification unit before dependency work. Successful unknown results count. Service failures attempt to decrement the counter; failure of Redis during the refund may leave a consumed unit. Use request IDs and customer reports to reconcile exceptional usage before billing. These quota counters are not an invoice ledger. A client timeout is ambiguous and retries can consume another unit.

Daily publishing limits count registrations that create a new transaction; rejected, busy and idempotent retries are refunded. Polling consumes the authenticated burst allowance, not monthly verification units. Public requests consume separate minute and day limits. Plan for IP rotation and shared NAT addresses.

## Data handling

Public browser checks send only SHA-256. Authenticated uploads are handled in memory; API code does not store original bytes or log bodies/keys. Evidence and registry data are public. Registration jobs retain an envelope and account identifier to support recovery. Confirm the deployment's own logs, traces and backups do not capture secrets or uploads.

Choose and implement retention periods for completed job data, account records and infrastructure logs before production. Keep raw signed transactions only while pending; confirmed/failed jobs remove the raw transaction. Limit Redis access because a pending signed transaction can be broadcast by anyone holding it.

## Release verification

Run lint, API tests, contract tests, local-chain integration, production build and runtime dependency audit. Verify public/file lookup, invalid credentials, quota exhaustion, register-only permissions and account isolation on staging. Use real PNG and JPEG provider fixtures; confirm the final downloaded file digest matches the signed claim. Inspect errors during Redis, RPC and Pinata failures. Do not use a successful local test as evidence that remote services are configured.

Measure availability, latency, unknown-rate and customer-specific usefulness. Define ownership of incidents, supported media types and evidence interpretation in customer terms. Do not promise universal AI detection or production SLA before these gates are met.
