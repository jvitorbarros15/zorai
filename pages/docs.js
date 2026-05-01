import Layout from '../components/layout/Layout';

const BASE_URL = 'https://zorai.vercel.app';

const endpoints = [
  {
    method: 'POST',
    path: '/api/register',
    audience: 'AI providers',
    summary:
      'Register AI-generated content on ZorAI and receive a blockchain-backed watermark plus a metadata template you can embed before distribution.',
    body: [
      ['imageHash', 'string', 'required', 'SHA-256 hash of the generated asset (hex string, 64 chars)'],
      ['modelUsed', 'string', 'required', 'Model identifier such as "gpt-image-1" or "sdxl"'],
      ['ipfsHash', 'string', 'required', 'IPFS CID or immutable storage pointer (recorded on-chain)'],
      ['company', 'string', 'optional', 'Publisher name for metadata and on-chain record'],
      ['externalId', 'string', 'optional', 'Your internal generation or asset tracking ID'],
      ['sourceUrl', 'string', 'optional', 'Canonical URL where the asset will be served'],
      ['contentType', 'string', 'optional', 'Asset type (defaults to "image")'],
      ['riskLevel', 'number', 'optional', '0 = low, 1 = medium, 2 = high. Defaults to 0'],
      ['riskReasons', 'string[]', 'optional', 'Array of policy or moderation flags'],
    ],
    request: `curl -X POST ${BASE_URL}/api/register \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "imageHash": "8f9d2f1e...",
    "modelUsed": "gpt-image-1",
    "ipfsHash": "bafybeiexample...",
    "company": "Example AI",
    "externalId": "gen_12345",
    "sourceUrl": "https://cdn.example.ai/assets/gen_12345.png",
    "riskLevel": 0,
    "riskReasons": []
  }'`,
    response: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "imageId": "8f9d2f1e...",
  "txHash": "0x8b2d4f...",
  "blockNumber": 23812345,
  "chain": "base-sepolia",
  "chainId": 84532,
  "contract": "0xd11eAEA00A92E6eE97DD14e6F97dbBb7971ef549",
  "watermark": {
    "version": "1.0",
    "zorai": true,
    "imageHash": "8f9d2f1e...",
    "model": "gpt-image-1",
    "registeredAt": "2026-04-21T23:12:10.000Z",
    "chain": "base-sepolia",
    "chainId": 84532,
    "contract": "0xd11eAEA00A92E6eE97DD14e6F97dbBb7971ef549",
    "txHash": "0x8b2d4f...",
    "blockNumber": 23812345
  },
  "watermarkHash": "eb02...",
  "metadataTemplate": {
    "aiGenerated": true,
    "zorai": {
      "watermark": { "version": "1.0", "zorai": true },
      "watermarkHash": "eb02..."
    },
    "xmpFields": {
      "XMP:ZorAI": "...full watermark...",
      "XMP:ZorAIHash": "eb02...",
      "XMP:AIGenerated": "true"
    }
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/verify?id={imageHash}',
    audience: 'Social, news, fact-checkers',
    summary:
      'Look up an asset by SHA-256 hash and retrieve the blockchain registration record. Public endpoint, no API key required.',
    params: [['id', 'string', 'required', 'SHA-256 hash of the image or asset to check (hex string, 64 chars)']],
    request: `curl "${BASE_URL}/api/verify?id=8f9d2f1e..."`,
    response: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "found": true,
  "isAiGenerated": true,
  "imageId": "8f9d2f1e...",
  "ipfsHash": "bafybeiexample...",
  "modelUsed": "gpt-image-1",
  "creator": "0xAbC123...",
  "registeredAt": "2026-04-21T23:12:10.000Z",
  "isVerified": false,
  "riskLevel": "low",
  "riskReasons": [],
  "watermark": {
    "onChainHash": "eb02...",
    "matchesBlockchain": null
  }
}`,
  },
  {
    method: 'POST',
    path: '/api/verify',
    audience: 'Platforms with metadata',
    summary:
      'Verify a hash and optionally compare embedded ZorAI watermark metadata against the blockchain record. Public endpoint, no API key required.',
    body: [
      ['imageHash', 'string', 'required', 'SHA-256 hash of the asset being inspected (hex string, 64 chars)'],
      ['watermark', 'object', 'optional', 'Full watermark object extracted from file metadata. If provided, will be compared against blockchain.'],
      ['watermarkHash', 'string', 'optional', 'Embedded watermark hash to compare (alternative to full watermark object)'],
    ],
    request: `curl -X POST ${BASE_URL}/api/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "imageHash": "8f9d2f1e...",
    "watermark": {
      "version": "1.0",
      "zorai": true,
      "imageHash": "8f9d2f1e...",
      "model": "gpt-image-1",
      "registeredAt": "2026-04-21T23:12:10.000Z",
      "chain": "base-sepolia",
      "chainId": 84532,
      "contract": "0xd11eAEA00A92E6eE97DD14e6F97dbBb7971ef549",
      "txHash": "0x8b2d4f...",
      "blockNumber": 23812345
    }
  }'`,
    response: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "found": true,
  "isAiGenerated": true,
  "imageId": "8f9d2f1e...",
  "watermark": {
    "onChainHash": "eb02...",
    "suppliedHash": "eb02...",
    "matchesBlockchain": true
  }
}`,
  },
];

const integrationSteps = [
  'Generate the asset and compute a SHA-256 hash of the exact bytes you will publish.',
  'Call POST /api/register with your API key and immutable storage pointer.',
  'Embed the returned watermark and watermarkHash into EXIF or XMP metadata before delivery.',
  'Let downstream platforms hash the file and call /api/verify to confirm provenance.',
];

const pythonExample = `import hashlib
import json
import requests

BASE_URL = "https://zorai.vercel.app"
API_KEY = "your_api_key"

def sha256_file(path: str) -> str:
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()

image_hash = sha256_file("output.png")

try:
    response = requests.post(
        f"{BASE_URL}/api/register",
        headers={
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
        },
        json={
            "imageHash": image_hash,
            "modelUsed": "gpt-image-1",
            "ipfsHash": "bafybeigdyrexample...",
            "company": "Example AI",
            "externalId": "gen_12345",
        },
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()

    print(f"Transaction: {payload['txHash']}")
    print(json.dumps(payload["metadataTemplate"], indent=2))
except requests.exceptions.RequestException as e:
    print(f"Error: {e}")`;

const fastApiExample = `from fastapi import FastAPI, HTTPException
import hashlib
import requests

app = FastAPI()
ZORAI_BASE_URL = "https://zorai.vercel.app"
ZORAI_API_KEY = "your_api_key"

def sha256_bytes(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()

@app.post("/publish-generated-image")
async def publish_generated_image(file_bytes: bytes):
    image_hash = sha256_bytes(file_bytes)

    try:
        response = requests.post(
            f"{ZORAI_BASE_URL}/api/register",
            headers={
                "Content-Type": "application/json",
                "x-api-key": ZORAI_API_KEY,
            },
            json={
                "imageHash": image_hash,
                "modelUsed": "gpt-image-1",
                "ipfsHash": "bafybeigdyrexample...",
                "company": "Example AI",
            },
            timeout=30,
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=str(e))`;

const verifyExample = `async function verifyUpload(imageHash, extractedWatermark) {
  const res = await fetch("https://zorai.vercel.app/api/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageHash,
      watermark: extractedWatermark,
    }),
  });

  const result = await res.json();

  return {
    shouldLabelAsAI: result.found,
    blockchainMatch: result.watermark.matchesBlockchain,
    model: result.modelUsed,
    riskLevel: result.riskLevel,
  };
}`;

function SectionTitle({ label, title, body }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <p className="section-label" style={{ color: 'var(--accent)', margin: '0 0 14px' }}>
        {label}
      </p>
      <h2
        style={{
          fontSize: '30px',
          lineHeight: 1,
          margin: '0 0 14px',
          color: 'var(--text-primary)',
          letterSpacing: '0.04em',
        }}
      >
        {title}
      </h2>
      {body ? (
        <p
          style={{
            margin: 0,
            maxWidth: '760px',
            color: 'var(--text-secondary)',
            fontSize: '15px',
            lineHeight: '1.8',
          }}
        >
          {body}
        </p>
      ) : null}
    </div>
  );
}

function CodeBlock({ code }) {
  return (
    <pre
      style={{
        margin: 0,
        padding: '20px 22px',
        overflowX: 'auto',
        border: '1px solid var(--border)',
        borderLeft: '2px solid var(--accent)',
        background: 'rgba(0, 0, 0, 0.34)',
        color: 'var(--text-secondary)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '12px',
        lineHeight: '1.75',
        whiteSpace: 'pre',
      }}
    >
      {code}
    </pre>
  );
}

function Table({ rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Field', 'Type', 'Required', 'Description'].map((cell) => (
              <th
                key={cell}
                style={{
                  textAlign: 'left',
                  padding: '0 16px 10px 0',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                }}
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([field, type, required, description]) => (
            <tr key={field}>
              <td
                style={{
                  padding: '12px 16px 12px 0',
                  verticalAlign: 'top',
                  color: 'var(--accent)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                }}
              >
                {field}
              </td>
              <td
                style={{
                  padding: '12px 16px 12px 0',
                  verticalAlign: 'top',
                  color: 'var(--cyan)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                }}
              >
                {type}
              </td>
              <td
                style={{
                  padding: '12px 16px 12px 0',
                  verticalAlign: 'top',
                  color: required === 'required' ? 'var(--risk-medium)' : 'var(--text-muted)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                }}
              >
                {required}
              </td>
              <td style={{ padding: '12px 0', verticalAlign: 'top', color: 'var(--text-secondary)', fontSize: '14px' }}>
                {description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EndpointCard({ endpoint }) {
  return (
    <section
      style={{
        border: '1px solid var(--border)',
        borderLeft: `2px solid ${endpoint.method === 'POST' ? 'var(--accent)' : 'var(--cyan)'}`,
        background: 'var(--bg-surface)',
        padding: '28px',
      }}
    >
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
        <span
          style={{
            color: endpoint.method === 'POST' ? 'var(--accent)' : 'var(--cyan)',
            border: `1px solid ${endpoint.method === 'POST' ? 'var(--accent)' : 'var(--cyan)'}`,
            padding: '2px 8px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.16em',
          }}
        >
          {endpoint.method}
        </span>
        <code style={{ color: 'var(--text-primary)', fontSize: '16px' }}>{endpoint.path}</code>
      </div>
      <p
        style={{
          margin: '0 0 20px',
          color: 'var(--text-secondary)',
          fontSize: '15px',
          lineHeight: '1.75',
          maxWidth: '760px',
        }}
      >
        {endpoint.summary}
      </p>
      <p className="section-label" style={{ color: 'var(--text-muted)', margin: '0 0 14px' }}>
        Audience: {endpoint.audience}
      </p>

      {endpoint.body ? <Table rows={endpoint.body} /> : null}
      {endpoint.params ? <Table rows={endpoint.params} /> : null}

      <div style={{ display: 'grid', gap: '18px', marginTop: '24px' }}>
        <div>
          <p className="section-label" style={{ color: 'var(--text-muted)', margin: '0 0 10px' }}>
            Example Request
          </p>
          <CodeBlock code={endpoint.request} />
        </div>
        <div>
          <p className="section-label" style={{ color: 'var(--text-muted)', margin: '0 0 10px' }}>
            Example Response
          </p>
          <CodeBlock code={endpoint.response} />
        </div>
      </div>
    </section>
  );
}

export default function DocsPage() {
  return (
    <Layout>
      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px 72px' }}>
        <section style={{ padding: '72px 0 44px', borderBottom: '1px solid var(--border)' }}>
          <p className="section-label" style={{ color: 'var(--accent)', margin: '0 0 18px' }}>
            Developer docs
          </p>
          <h1
            style={{
              margin: '0 0 18px',
              fontSize: 'clamp(40px, 6vw, 76px)',
              lineHeight: 0.92,
              letterSpacing: '0.03em',
              color: 'var(--text-primary)',
            }}
          >
            REST API FOR
            <br />
            <span style={{ color: 'var(--accent)', textShadow: '0 0 30px var(--accent-glow)' }}>AI PROVENANCE</span>
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: '720px',
              color: 'var(--text-secondary)',
              fontSize: '16px',
              lineHeight: '1.85',
            }}
          >
            ZorAI exposes a REST API that lets AI companies register generated content on Base Sepolia and returns
            metadata watermark fields they can embed into every file. Social platforms, newsrooms, and fact-checkers
            can then verify the same asset against the blockchain using either the content hash alone or the embedded
            watermark payload.
          </p>
        </section>

        <section
          style={{
            padding: '34px 0',
            borderBottom: '1px solid var(--border)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
          }}
        >
          {[
            ['Protocol', 'REST over JSON'],
            ['Network', 'Base Sepolia (84532)'],
            ['Auth', 'x-api-key on register'],
            ['Verifier access', 'Public verify endpoint'],
          ].map(([title, value]) => (
            <div key={title} className="tech-card" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '6px' }}>{title}</div>
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </section>

        <section style={{ padding: '52px 0', borderBottom: '1px solid var(--border)' }}>
          <SectionTitle
            label="Integration flow"
            title="HOW PUBLISHERS SHOULD USE IT"
            body="The recommended flow keeps the blockchain record immutable while making the distributed file self-describing through metadata."
          />
          <div style={{ display: 'grid', gap: '14px' }}>
            {integrationSteps.map((step, index) => (
              <div key={step} className="tech-card" style={{ padding: '18px 22px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <span
                    style={{
                      width: '28px',
                      height: '28px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--accent)',
                      color: 'var(--accent)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      flexShrink: 0,
                    }}
                  >
                    0{index + 1}
                  </span>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.75' }}>{step}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: '52px 0', borderBottom: '1px solid var(--border)' }}>
          <SectionTitle
            label="Authentication"
            title="API KEY MODEL"
            body="Registration is authenticated because it writes to the blockchain through your platform signer. Verification is public so downstream platforms can query provenance without a wallet or an API key."
          />
          <CodeBlock code={'x-api-key: YOUR_API_KEY'} />
        </section>

        <section style={{ padding: '52px 0', borderBottom: '1px solid var(--border)' }}>
          <SectionTitle
            label="HTTP Status Codes"
            title="EXPECTED RESPONSES"
            body="All endpoints return JSON responses. Status codes indicate success or failure. Always check the status code before parsing the response body."
          />
          <div style={{ display: 'grid', gap: '14px' }}>
            {[
              ['200', 'Success', 'Request succeeded (most common response)'],
              ['201', 'Created', 'Resource created (registration successful)'],
              ['400', 'Bad Request', 'Invalid parameters, missing fields, or malformed JSON'],
              ['401', 'Unauthorized', 'Missing or invalid API key (POST /api/register only)'],
              ['429', 'Too Many Requests', 'Rate limit exceeded. Retry after 60 seconds'],
              ['500', 'Server Error', 'Internal server error. Check status page or retry later'],
            ].map(([code, title, desc]) => (
              <div key={code} className="tech-card" style={{ padding: '18px 22px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: code.startsWith('2') ? 'var(--text-primary)' : 'var(--risk-medium)',
                      minWidth: '50px',
                    }}
                  >
                    {code}
                  </span>
                  <div>
                    <p style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontWeight: '500' }}>{title}</p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: '52px 0', borderBottom: '1px solid var(--border)' }}>
          <SectionTitle
            label="Watermark"
            title="WHAT IS ACTUALLY VERIFIED"
            body="The blockchain-verifiable watermark includes only fields that can be reconstructed from on-chain state and the registration event. Optional publisher metadata can still be embedded, but only the watermark and watermarkHash are considered cryptographically verifiable."
          />
          <CodeBlock
            code={`{
  "version": "1.0",
  "zorai": true,
  "imageHash": "8f9d...c1a2",
  "model": "gpt-image-1",
  "registeredAt": "2026-04-21T23:12:10.000Z",
  "chain": "base-sepolia",
  "chainId": 84532,
  "contract": "0xd11eAEA00A92E6eE97DD14e6F97dbBb7971ef549",
  "txHash": "0x8b2d...",
  "blockNumber": 23812345
}`}
          />
        </section>

        <section style={{ padding: '52px 0', borderBottom: '1px solid var(--border)', display: 'grid', gap: '22px' }}>
          <SectionTitle
            label="Endpoints"
            title="REFERENCE"
            body="These endpoints are enough to register assets from an AI generation pipeline and verify them from moderation or newsroom tooling."
          />
          {endpoints.map((endpoint) => (
            <EndpointCard key={`${endpoint.method}-${endpoint.path}`} endpoint={endpoint} />
          ))}
        </section>

        <section style={{ padding: '52px 0', borderBottom: '1px solid var(--border)' }}>
          <SectionTitle
            label="Examples"
            title="CLIENT IMPLEMENTATIONS"
            body="You can consume the ZorAI REST API from any stack. Here are examples for a Python script, a FastAPI backend, and a verifier service."
          />
          <div style={{ display: 'grid', gap: '22px' }}>
            <div>
              <p className="section-label" style={{ color: 'var(--text-muted)', margin: '0 0 10px' }}>
                Python
              </p>
              <CodeBlock code={pythonExample} />
            </div>
            <div>
              <p className="section-label" style={{ color: 'var(--text-muted)', margin: '0 0 10px' }}>
                FastAPI bridge
              </p>
              <CodeBlock code={fastApiExample} />
            </div>
            <div>
              <p className="section-label" style={{ color: 'var(--text-muted)', margin: '0 0 10px' }}>
                Verifier service
              </p>
              <CodeBlock code={verifyExample} />
            </div>
          </div>
        </section>

        <section style={{ padding: '52px 0 0' }}>
          <SectionTitle
            label="Who benefits"
            title="TARGET USERS"
            body="The same infrastructure supports first-party publishers and third-party verification partners."
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
            }}
          >
            {[
              ['AI companies', 'Write provenance to-chain and ship every generated asset with reusable metadata watermark fields.'],
              ['Social networks', 'Hash uploads, call /api/verify, and label content that maps to a ZorAI registration.'],
              ['Newsrooms', 'Validate suspicious images before publication and compare embedded metadata with the blockchain record.'],
              ['Fact-checkers', 'Use the public endpoint to retrieve model, timestamp, risk level, and creator address.'],
            ].map(([title, description]) => (
              <div key={title} className="tech-card" style={{ padding: '22px' }}>
                <div style={{ color: 'var(--text-primary)', fontSize: '18px', marginBottom: '10px' }}>{title}</div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.75' }}>{description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
