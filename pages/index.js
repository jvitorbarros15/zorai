import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../components/layout/Layout";
import VerificationResult from "../components/VerificationResult";
import { request, fileHash } from "../lib/browser-api";

export default function Home() {
  const router = useRouter();
  const [digest, setDigest] = useState(""),
    [file, setFile] = useState(null),
    [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (typeof router.query.id === "string") setDigest(router.query.id);
  }, [router.query.id]);
  async function verify(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const hash = file ? await fileHash(file) : digest.trim().toLowerCase();
      if (!/^[a-f0-9]{64}$/.test(hash))
        throw new Error(
          "Enter a SHA-256 digest containing 64 hexadecimal characters, or select an image.",
        );
      setDigest(hash);
      setResult(
        await request("/api/public/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageHash: hash }),
        }),
      );
    } catch (err) {
      setError(
        err.name === "TimeoutError"
          ? "Verification timed out. Please retry."
          : err.message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Layout>
      <section className="hero">
        <span className="eyebrow">Public AI provenance registry</span>
        <h1>
          Trace the evidence
          <br />
          <span>behind an image.</span>
        </h1>
        <p className="lead">
          Check whether an exact image matches a signed AI-origin claim recorded
          on the blockchain.
        </p>
        <p className="muted">
          No wallet needed. No matching record means unknown.
        </p>
      </section>
      <div className="grid">
        <section className="panel">
          <h2>Verify an image</h2>
          <p>
            Your browser calculates the file digest. The public checker sends
            only that digest.
          </p>
          <form onSubmit={verify}>
            <fieldset disabled={busy}>
              <label htmlFor="image">
                Image file{" "}
                <span className="muted">PNG or JPEG · up to 3 MB</span>
              </label>
              <input
                id="image"
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => {
                  setFile(e.target.files[0] || null);
                  setResult(null);
                  setError("");
                }}
              />
              <label htmlFor="digest">Or paste a SHA-256 digest</label>
              <input
                id="digest"
                className="mono"
                value={digest}
                disabled={Boolean(file)}
                onChange={(e) => {
                  setDigest(e.target.value);
                  setResult(null);
                  setError("");
                }}
                placeholder="64 hexadecimal characters"
                autoComplete="off"
                spellCheck={false}
              />
              {file && (
                <p className="muted">
                  Selected: {file.name}. Clear the file selection to enter a
                  digest.
                </p>
              )}
              <button type="submit">
                {busy ? "Checking evidence…" : "Verify provenance"}
              </button>
            </fieldset>
          </form>
          <div aria-live="polite">
            {busy && (
              <p>Reading the registry and validating available evidence…</p>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </div>
          <p className="small muted">
            Public checks: 6 per minute per client address, with a shared daily
            cap. Results cover this registry only.
          </p>
        </section>
        <aside className="panel subtle">
          <span className="eyebrow">For developers</span>
          <h2>Verification in your workflow.</h2>
          <p>
            Use the API to check file bytes or a digest, inspect metadata, and
            retrieve signed evidence with account-level usage limits.
          </p>
          <Link href="/docs" className="button secondary">
            Explore the API
          </Link>
          <hr />
          <h3>What a match proves</h3>
          <p>
            An approved issuer signed an AI-origin claim that matches these
            exact bytes. The record makes that claim inspectable.
          </p>
          <h3>What remains unknown</h3>
          <p>
            An unsigned label, a screenshot, or a missing record cannot
            establish whether an image was AI-generated.
          </p>
        </aside>
      </div>
      <div aria-live="polite">
        <VerificationResult result={result} />
      </div>
      <section className="section">
        <span className="eyebrow">How provenance works</span>
        <div className="steps">
          <div>
            <b>01 / Mark</b>
            <h3>Keep the source context</h3>
            <p>
              An approved integration prepares a metadata marker before
              calculating the final image digest.
            </p>
          </div>
          <div>
            <b>02 / Attest</b>
            <h3>Sign an accountable claim</h3>
            <p>
              The issuer signs the digest, source and model. The registry stores
              a reference to that evidence.
            </p>
          </div>
          <div>
            <b>03 / Verify</b>
            <h3>Check the exact file</h3>
            <p>
              ZorAI checks the record, signature, approved issuer and digest,
              and returns the evidence or an unknown result.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
