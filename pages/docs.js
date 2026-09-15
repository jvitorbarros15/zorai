import Link from "next/link";
import Layout from "../components/layout/Layout";
const verifyExample = `curl https://YOUR-HOST/api/verify \
  -H "Authorization: Bearer $ZORAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"imageHash":"<64 lowercase hex characters>"}'`;
const issuerExample = `const { prepareRegistration, ZorAIClient } = require('./sdk');
const prepared = await prepareRegistration({
  bytes: originalPngOrJpeg,
  signer: issuerWallet,
  issuerId: 'approved-studio', source: 'approved-source',
  model: 'model-version', chainId: 84532,
  registryAddress: process.env.REGISTRY_ADDRESS,
});
const client = new ZorAIClient({
  baseUrl: process.env.ZORAI_BASE_URL,
  apiKey: process.env.ZORAI_API_KEY,
});
const job = await client.register(prepared);
// Save prepared.bytes unchanged. Publish after status === 'confirmed'.
const status = await client.registration(prepared.evidence.claim.imageHash);`;
export default function Docs() {
  return (
    <Layout title="API documentation">
      <section className="hero compact">
        <span className="eyebrow">Developer API · v1 pilot</span>
        <h1>
          Integrate provenance
          <br />
          <span>verification.</span>
        </h1>
        <p className="lead">
          Authenticated checks, signed issuer evidence and public registry
          records.
        </p>
        <div className="actions">
          <Link href="/connect" className="button">
            Open API console
          </Link>
          <a className="button secondary" href="/openapi.json">
            OpenAPI specification
          </a>
        </div>
      </section>
      <article className="prose panel">
        <h2>Access and usage</h2>
        <p>
          Send your operator-issued API key as a Bearer token from a server.
          Keys have explicit scopes, an activation state, optional expiry and a
          monthly request allowance. Self-service billing is not enabled.
        </p>
        <p>
          Successful verification responses, including unknown results, consume
          one request. Invalid input is rejected before monthly usage is
          reserved. Service failures attempt to refund the reservation. A
          storage outage during a refund requires operator reconciliation. There
          is a separate burst limit of 120 authenticated requests per minute per
          account.
        </p>
        <h2>Verify a digest or image</h2>
        <pre>{verifyExample}</pre>
        <p>
          <code>POST /api/verify</code> accepts either <code>imageHash</code> or{" "}
          <code>assetBase64</code>. If both are supplied, they must match. File
          inspection supports PNG/JPEG up to 3 MB. Use{" "}
          <code>GET /api/verify?id=DIGEST</code> for a digest lookup.
        </p>
        <p>
          File bytes are processed in memory. The response includes the digest,
          provenance outcome, network, usage and available evidence. File
          requests also return untrusted metadata observations; presence of a
          marker is never sufficient proof.
        </p>
        <h2>Interpret outcomes</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>attested</code>
                </td>
                <td>
                  An approved issuer's signature and claim match the registry
                  digest and model. <code>isAiGenerated: true</code> refers to
                  that attestation.
                </td>
              </tr>
              <tr>
                <td>
                  <code>unknown</code>
                </td>
                <td>
                  No registry record. <code>isAiGenerated: null</code>; human
                  origin is not established.
                </td>
              </tr>
              <tr>
                <td>
                  <code>unvalidated_record</code>
                </td>
                <td>
                  A record exists with unsupported evidence. Origin remains
                  unknown.
                </td>
              </tr>
              <tr>
                <td>
                  <code>untrusted_attestation</code> / <code>mismatch</code>
                </td>
                <td>
                  Evidence could not establish approved provenance. Origin
                  remains unknown.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          All completed lookups return HTTP 200. Unavailable RPC or evidence
          services return a service error, never a fabricated “not found.”
          Exact-file matching does not survive resizing, recompression,
          screenshots or stripped metadata.
        </p>
        <h2 id="registration">Approved issuer registration</h2>
        <p>
          Verification customers do not need registration permission. Publishing
          additionally requires an approved signing identity, a register-scoped
          key bound to that issuer, and a daily registration-attempt allowance.
        </p>
        <pre>{issuerExample}</pre>
        <p>
          The repository's Node SDK inserts a version 1 ZorAI marker containing
          issuerId and nonce into PNG tEXt or JPEG XMP. It then hashes the final
          bytes and signs an EIP-712 claim containing imageHash, issuerId,
          source, model, issuedAt and nonce, using a domain bound to the chain
          and registry address. It is a custom signed attestation format.
        </p>
        <p>
          <code>POST /api/register</code> accepts{" "}
          <code>{"{assetBase64, evidence}"}</code>. Claims must be issued within
          24 hours. The server verifies the issuer, signature, marker and byte
          digest before publishing evidence to IPFS and submitting the registry
          transaction.
        </p>
        <p>
          HTTP 202 means submitted, not confirmed. Poll{" "}
          <code>GET /api/registration?id=DIGEST</code> with the same account
          until confirmed or failed. Retry the identical POST to recover an
          uncertain broadcast; daily attempt limits also apply to retries. A
          different claim for a reserved digest returns 409. Failed transactions
          require operator investigation. Never publish a modified copy of the
          prepared file.
        </p>
        <p>
          Existing C2PA credentials are not independently validated yet. The SDK
          rejects recognized source credentials before modification; the parser
          is deliberately limited. Do not use this workflow to rewrite
          C2PA-signed media. No direct Midjourney, Sora or OpenAI integration is
          claimed.
        </p>
        <h2>Other endpoints</h2>
        <ul>
          <li>
            <code>GET /api/account</code>: authenticated account ID, scopes and
            monthly usage.
          </li>
          <li>
            <code>GET /api/status</code>: configured network and pilot mode; not
            a dependency health check.
          </li>
          <li>
            <code>POST /api/public/verify</code>: public hash-only checks,
            6/minute per client address and a shared 5,000/day cap. Designed for
            interactive checks.
          </li>
        </ul>
        <h2>Errors</h2>
        <p>
          Errors contain <code>{"{error: {code, message}, requestId}"}</code>.
          Keep the request ID when reporting a problem. 400/413/415: input
          error; 401: invalid key; 403: missing permission; 409: registration
          conflict or busy publisher; 422: invalid evidence; 429: quota;
          502/503: dependency or configuration failure. Retry transient failures
          with backoff. Do not blindly retry a paid verification after an
          ambiguous client timeout because it may have completed.
        </p>
        <h2>Independent inspection and trust</h2>
        <p>
          Read the registry using the contract address and chain in the
          response. Retrieve the evidence CID and verify its EIP-712 signature
          against your own trusted issuer policy. A signature proves control of
          a key; approval of the organization and its source capture process
          remains a trust decision.
        </p>
        <p>
          Blockchain entries and published evidence are public. Keep personal
          data and prompts out of claims. See{" "}
          <Link href="/about">privacy and limitations</Link>.
        </p>
      </article>
    </Layout>
  );
}
