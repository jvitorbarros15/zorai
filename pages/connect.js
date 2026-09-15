import { useState } from "react";
import Link from "next/link";
import Layout from "../components/layout/Layout";
import VerificationResult from "../components/VerificationResult";
import { request } from "../lib/browser-api";

export default function Console() {
  const [key, setKey] = useState(""),
    [account, setAccount] = useState(null),
    [digest, setDigest] = useState(""),
    [result, setResult] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function run(event, verify) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const headers = {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
      };
      if (verify) {
        if (!/^[a-fA-F0-9]{64}$/.test(digest.trim()))
          throw new Error("Enter a 64-character SHA-256 digest.");
        const data = await request("/api/verify", {
          method: "POST",
          headers,
          body: JSON.stringify({ imageHash: digest.trim() }),
        });
        setResult(data);
        setAccount((current) =>
          current ? { ...current, usage: data.usage } : current,
        );
      } else setAccount(await request("/api/account", { headers }));
    } catch (err) {
      setError(err.message);
      if (!verify) setAccount(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Layout title="API console">
      <section className="hero compact">
        <span className="eyebrow">Developer workspace</span>
        <h1>API console</h1>
        <p className="lead">
          Check your account allowance and make a verification request.
        </p>
        <p>
          Pilot access is provisioned by the operator. Self-service checkout is
          not available yet.{" "}
          <Link href="/docs">Read the integration guide.</Link>
        </p>
      </section>
      <div className="grid">
        <section className="panel">
          <h2>Connect your account</h2>
          <form onSubmit={(e) => run(e, false)}>
            <fieldset disabled={busy}>
              <label htmlFor="key">API key</label>
              <input
                id="key"
                type="password"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setAccount(null);
                  setResult(null);
                }}
                autoComplete="off"
                spellCheck={false}
                required
              />
              <p className="small muted">
                Held in this page's memory only. Reload or clear to remove it.
                Never put a secret API key in a public website.
              </p>
              <div className="actions">
                <button type="submit">Check account</button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setKey("");
                    setAccount(null);
                    setResult(null);
                    setError("");
                  }}
                >
                  Clear key
                </button>
              </div>
            </fieldset>
          </form>
          {account && (
            <dl>
              <dt>Account</dt>
              <dd>{account.account.id}</dd>
              <dt>Monthly usage</dt>
              <dd>
                {account.usage.used} / {account.usage.limit}
              </dd>
              <dt>Remaining</dt>
              <dd>{account.usage.remaining}</dd>
              <dt>Resets (UTC)</dt>
              <dd>{account.usage.resetsAt}</dd>
            </dl>
          )}
        </section>
        <section className="panel">
          <h2>Try a verification</h2>
          <p>
            A completed check, including an unknown result, uses one request
            from your monthly allowance.
          </p>
          <form onSubmit={(e) => run(e, true)}>
            <fieldset disabled={busy || !account}>
              <label htmlFor="api-digest">Image SHA-256</label>
              <input
                id="api-digest"
                value={digest}
                onChange={(e) => setDigest(e.target.value)}
                required
                className="mono"
                autoComplete="off"
              />
              <button type="submit">Verify with API key</button>
            </fieldset>
          </form>
        </section>
      </div>
      <div aria-live="polite">
        {busy && <p>Processing request…</p>}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <VerificationResult result={result} />
      </div>
    </Layout>
  );
}
