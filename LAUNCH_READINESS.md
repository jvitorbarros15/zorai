# ZorAI launch readiness

## Business direction

Customers pay for verification API access. The product verifies available source evidence; it does not promise a yes/no classification for every image. The main commercial risk is **coverage**: without meaningful trusted-source ingestion, most files will return unknown. Blockchain does not solve that supply problem. Profitability depends on customers valuing coverage, response reliability and structured evidence enough to cover acquisition, support and infrastructure costs.

This branch is a substantial pilot implementation. It is not evidence of product-market fit, production security certification or guaranteed profit.

## Implementation delivered for review

- Reproducible build/CI foundation and supported Next 15 baseline (#17).
- Server-verified EIP-712 issuer claims, exact-byte binding, PNG/JPEG metadata preparation (#18, #19).
- Hashed scoped API keys, request quotas, account usage, retired unsafe demo endpoints (#20, #25).
- Wallet-free public lookup, developer console, responsive forms and evidence explanations (#21).
- Durable registration job and signed-transaction persistence, idempotent retry, confirmation polling (#22).
- Record-specific update permissions, two-step owner transfer and accurate current high-risk collection (#24).
- SDK, configuration examples, API reference and release runbook (#26).

## Required before accepting production customers

1. **Source coverage (#23, #9):** prove direct access to at least one controlled generation workflow, approve its identity and signing process, and implement cryptographic validation/preservation for provider C2PA credentials. Current arbitrary-provider claims are restricted by configuration, not independently discovered from pixels. The pilot signer adapter is not a deployed OpenAI/Midjourney/Sora connector.
2. **Real infrastructure (#22, #26):** provision isolated staging Redis, Pinata, RPC and service signer; deploy the reviewed contract; authorize the registrar. Demonstrate an actual staging registration and file verification after restart. Measure latency, dependency failure behavior, quotas and concurrent demand. Public checks need a verified trusted proxy/IP setup on the chosen host.
3. **Contract review (#24):** independently review new bytecode and ownership custody; deploy separately from the historical registry; publish network/address and migration policy. Confirmation polling currently accepts the first receipt: choose finality policy and implement reorg handling before production guarantees.
4. **Commercial onboarding (#25):** validate willingness to pay with target customers, set allowance/pricing from measured costs, implement payment collection and reliable entitlement synchronization (or a documented invoiced pilot process). No automated checkout, tax or invoice system exists here.
5. **Operations/privacy (#26):** define retention and deletion for account/job records, secrets rotation, incident ownership, audit logs, abuse controls, dependency alerting, issuer revocation/appeal policy and support response targets. The current config-managed issuer directory is not a public independent trust list.
6. **Load and recovery (#22):** signer processing is intentionally serialized. Stuck transactions are replaced with +25% fees after a timeout; failed transactions are archived allowing new attempts for the same digest. Add durable scheduled reconciliation and throughput planning if pilot traffic needs them. Resolve failed usage refunds before invoicing; counters are not a financial ledger.
7. **Development dependencies (#17):** the runtime audit is clean after compatible updates. The full dependency audit still flags the Hardhat 2 development toolchain (including transitive high-severity findings). Migrate/review the toolchain before using it with production deployment credentials; do not interpret a runtime-only audit as an all-dependencies clearance.

## Commercial validation

Start with a narrow customer workflow where the source can actually be integrated. Measure the share of customer files with useful evidence, false claims caught, unknown outcomes, support time and repeat usage. Test willingness to pay through a small paid pilot before building a broad marketplace.

Per-customer contribution = revenue − verification RPC/storage costs − allocated publisher costs − payment fees − support. Measure at representative load and include public-check abuse costs. Do not set production prices from guessed per-call costs. Free registry access means the paid API must offer useful convenience, reliability, coverage and support.

## Tracking

Parent: [#16](https://github.com/jvitorbarros15/zorai/issues/16).
Build #17; evidence #18; metadata #19; API security #20; UI #21; persistence #22; source connector #23; contract #24; commercial access #25; release operations #26.
Keep issues open until their deployment and validation acceptance criteria are met.
