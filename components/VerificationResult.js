export default function VerificationResult({ result }) {
  if (!result) return null;
  const attested = result.status === "attested";
  return (
    <section
      className={"panel result " + (attested ? "positive" : "")}
      aria-labelledby="result-title"
    >
      <span className="eyebrow">Verification result</span>
      <h2 id="result-title">
        {attested ? "AI origin attested" : "AI origin unknown"}
      </h2>
      <p>{result.message}</p>
      <dl>
        <dt>File SHA-256</dt>
        <dd className="mono wrap">{result.imageHash}</dd>
        {result.issuer && (
          <>
            <dt>Approved issuer</dt>
            <dd>{result.issuer.name}</dd>
            <dt>Source / model claimed</dt>
            <dd>
              {result.source} / {result.model}
            </dd>
          </>
        )}
        {result.registeredAt && (
          <>
            <dt>Registered</dt>
            <dd>{new Date(result.registeredAt).toLocaleString()}</dd>
          </>
        )}
        {result.network && (
          <>
            <dt>Registry network</dt>
            <dd>
              {result.network.name}
              {result.network.testnet ? " (test network)" : ""}
            </dd>
          </>
        )}
      </dl>
      {result.network?.explorer && (
        <p>
          <a
            href={`${result.network.explorer}/address/${result.network.contract}#readContract`}
            target="_blank"
            rel="noreferrer"
          >
            Inspect the registry on the block explorer ↗
          </a>
        </p>
      )}
      {result.evidenceCid && (
        <p className="wrap">
          <a
            href={`https://gateway.pinata.cloud/ipfs/${encodeURIComponent(result.evidenceCid)}`}
            target="_blank"
            rel="noreferrer"
          >
            Read the published evidence ↗
          </a>
        </p>
      )}
      <p className="muted">
        {result.limitations ||
          "A missing or unsupported record is inconclusive. Metadata can be stripped and changed copies have different digests."}
      </p>
    </section>
  );
}
