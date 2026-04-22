import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { useBlockchain } from '../contexts/BlockchainContext';
import { useWallet } from '../contexts/WalletContext';
import Link from 'next/link';

const RISK_COLORS = {
  high: 'var(--risk-high)',
  medium: 'var(--risk-medium)',
  low: 'var(--risk-low)',
};

const RISK_BADGE_CLASS = {
  high: 'badge-danger',
  medium: 'badge-warning',
  low: 'badge-success',
};

export default function GenerateAIImage() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const { registerImage } = useBlockchain();
  const { isConnected, connectWallet } = useWallet();

  if (!isConnected) {
    return (
      <Layout>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ padding: '64px 0 48px', borderBottom: '1px solid var(--border)' }}>
            <p className="section-label" style={{ color: 'var(--accent)', marginBottom: '16px' }}>&nbsp;AI Generator</p>
            <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.03em', margin: 0, lineHeight: 0.95 }}>
              GENERATE AI<br />
              <span style={{ color: 'var(--accent)', textShadow: '0 0 32px var(--accent-glow)' }}>IMAGE</span>
            </h1>
          </div>
          <div style={{ padding: '64px 0', display: 'flex', justifyContent: 'center' }}>
            <div style={{ border: '1px solid var(--border)', borderLeft: '2px solid var(--accent)', backgroundColor: 'var(--bg-surface)', padding: '48px', maxWidth: '440px', width: '100%', textAlign: 'center', boxShadow: '0 0 40px var(--accent-glow)' }}>
              <div style={{ width: '64px', height: '64px', border: '1px solid var(--accent)', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-elevated)' }}>
                <img src="/metamask-logo.svg" alt="MetaMask" style={{ width: '40px', height: '40px' }} />
              </div>
              <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.06em', margin: '0 0 12px' }}>
                WALLET NOT CONNECTED
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7', margin: '0 0 28px', fontFamily: "'Outfit', sans-serif" }}>
                Connect your MetaMask wallet to generate and register AI images on the blockchain.
              </p>
              <button onClick={connectWallet} className="btn-accent" style={{ width: '100%', padding: '12px', cursor: 'pointer', textAlign: 'center', display: 'block' }}>
                ⬡ Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setImageUrl('');
    setAnalysis(null);

    try {
      const response = await fetch('/api/generateImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      let data;
      try { data = await response.json(); }
      catch { throw new Error('Server error: Please try again later.'); }

      if (!response.ok) throw new Error(data.error || 'Failed to generate image');

      setImageUrl(data.data.imageUrl);
      setAnalysis(data.data);

      if (isConnected && (data.data.riskLevel === 'medium' || data.data.riskLevel === 'high')) {
        await registerImage(
          data.data.id,
          data.data.modelUsed,
          data.data.ipfsHash,
          data.data.riskLevel === 'high' ? 2 : 1,
          data.data.reasons
        );
      }
    } catch (err) {
      if (
        err.code === 4001 ||
        err.reason === 'rejected' ||
        (err.error && err.error.code === 4001) ||
        (err.info && err.info.error && err.info.error.code === 4001)
      ) {
        setError('Transaction rejected in MetaMask. Please approve it to continue.');
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>

        {/* ── Header ── */}
        <div style={{ padding: '64px 0 48px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 24, right: 0, width: '100px', height: '70px', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', opacity: 0.4 }} />
          <p className="section-label" style={{ color: 'var(--accent)', marginBottom: '16px' }}>&nbsp;AI Generator</p>
          <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.03em', margin: 0, lineHeight: 0.95 }}>
            GENERATE AI<br />
            <span style={{ color: 'var(--accent)', textShadow: '0 0 32px var(--accent-glow)' }}>IMAGE</span>
          </h1>
        </div>

        <div style={{ padding: '48px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: analysis ? '1fr 1fr' : '1fr', gap: '32px', alignItems: 'start' }}>

            {/* ── Left: form ── */}
            <div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label htmlFor="prompt" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '10px' }}>
                    Image Prompt
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="form-field"
                    placeholder="Describe the image you want to generate…"
                    required
                    style={{ minHeight: '120px', resize: 'vertical', lineHeight: '1.6', width: '100%' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-accent"
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    padding: '14px',
                    fontSize: '12px',
                    opacity: isLoading ? 0.6 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isLoading ? '⟳ GENERATING…' : '⚡ GENERATE IMAGE'}
                </button>
              </form>

              {/* Loading state */}
              {isLoading && (
                <div style={{ marginTop: '24px', padding: '20px', border: '1px solid var(--border)', borderLeft: '2px solid var(--accent)', backgroundColor: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="status-dot online" />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
                      Generating image · Running risk analysis · Preparing for registration…
                    </span>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ marginTop: '16px', padding: '12px 16px', borderLeft: '2px solid var(--risk-high)', backgroundColor: 'var(--risk-high-dim)' }}>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--risk-high)', margin: 0 }}>
                    ERR: {error}
                  </p>
                </div>
              )}

              {/* Info */}
              <div style={{ marginTop: '28px', border: '1px solid var(--border)', borderLeft: '2px solid var(--cyan)', backgroundColor: 'var(--bg-surface)', padding: '18px 20px' }}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--cyan)', margin: '0 0 10px' }}>
                  Auto-Registration
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                  Medium and high-risk images are automatically flagged and registered on the blockchain. Low-risk images are generated without on-chain storage.
                </p>
              </div>
            </div>

            {/* ── Right: result ── */}
            {analysis && imageUrl && analysis.ipfsHash && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fade-up 0.3s ease' }}>

                {/* Generated image */}
                <div>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 10px' }}>
                    Generated Output
                  </p>
                  <div style={{
                    border: `1px solid ${RISK_COLORS[analysis.riskLevel] || 'var(--accent)'}`,
                    boxShadow: `0 0 32px ${analysis.riskLevel === 'high' ? 'rgba(255,51,71,0.15)' : 'var(--accent-glow)'}`,
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-elevated)',
                  }}>
                    <img
                      src={`https://ipfs.io/ipfs/${analysis.ipfsHash}`}
                      alt="Generated"
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'contain', display: 'block' }}
                    />
                  </div>
                </div>

                {/* Analysis */}
                <div style={{ border: '1px solid var(--border)', borderLeft: '2px solid var(--accent)', backgroundColor: 'var(--bg-surface)', padding: '22px' }}>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 16px' }}>
                    Risk Analysis
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--text-muted)' }}>Risk Level:</span>
                    <span className={`badge ${RISK_BADGE_CLASS[analysis.riskLevel] || 'badge-accent'}`}>
                      {analysis.riskLevel?.toUpperCase()}
                    </span>
                  </div>

                  {analysis.reasons && analysis.reasons.length > 0 && (
                    <div>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 10px' }}>
                        Flags
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {analysis.reasons.map((reason, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ color: RISK_COLORS[analysis.riskLevel], fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', flexShrink: 0, marginTop: '1px' }}>▸</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: "'Outfit', sans-serif", lineHeight: '1.5' }}>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(analysis.riskLevel === 'medium' || analysis.riskLevel === 'high') && (
                    <div style={{ marginTop: '16px', padding: '10px 14px', borderLeft: '2px solid var(--risk-medium)', backgroundColor: 'rgba(255,140,0,0.06)' }}>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--risk-medium)', margin: 0, letterSpacing: '0.08em' }}>
                        ⚠ Auto-registered on blockchain.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}
