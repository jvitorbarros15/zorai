import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { useWallet } from '../contexts/WalletContext';

const BENEFITS = [
  { label: 'Register Images', desc: 'Submit AI-generated images to the blockchain for permanent verification and proof of origin.' },
  { label: 'Track History', desc: 'Access your complete history of registered images and all on-chain verification records.' },
  { label: 'Verify Authenticity', desc: 'Verify the authenticity and provenance of any registered AI-generated image on-chain.' },
  { label: 'Secure Storage', desc: 'Your image IDs are cryptographically stored — permanent, public, and tamper-proof.' },
];

export default function Connect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const { connectWallet, isConnected, account, disconnectWallet } = useWallet();

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    try {
      await connectWallet();
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>

        {/* ── Header ── */}
        <div style={{ padding: '64px 0 48px', borderBottom: '1px solid var(--border)' }}>
          <p className="section-label" style={{ color: 'var(--accent)', marginBottom: '16px' }}>&nbsp;Wallet Auth</p>
          <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.03em', margin: 0, lineHeight: 0.95 }}>
            CONNECT YOUR<br />
            <span style={{ color: 'var(--accent)', textShadow: '0 0 32px var(--accent-glow)' }}>WALLET</span>
          </h1>
        </div>

        <div style={{ padding: '48px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>

          {/* ── Wallet card ── */}
          <div>
            <div style={{
              border: '1px solid var(--border)',
              borderLeft: `2px solid ${isConnected ? 'var(--risk-low)' : 'var(--accent)'}`,
              backgroundColor: 'var(--bg-surface)',
              padding: '36px',
              boxShadow: isConnected ? '0 0 32px rgba(0, 200, 100, 0.08)' : '0 0 32px var(--accent-glow)',
              transition: 'all 0.3s ease',
            }}>
              {/* MetaMask header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  border: `1px solid ${isConnected ? 'var(--risk-low)' : 'var(--accent)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--bg-elevated)',
                  flexShrink: 0,
                }}>
                  <img src="/metamask-logo.svg" alt="MetaMask" style={{ width: '36px', height: '36px' }} />
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '0.04em' }}>
                    METAMASK
                  </h3>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                    Browser Extension Wallet
                  </span>
                </div>
              </div>

              {/* Status indicator */}
              <div style={{ marginBottom: '24px', padding: '12px 14px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`status-dot ${isConnected ? 'online' : ''}`} style={{ background: isConnected ? 'var(--risk-low)' : 'var(--text-muted)' }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: isConnected ? 'var(--risk-low)' : 'var(--text-muted)', letterSpacing: '0.1em' }}>
                    {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                  </span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ marginBottom: '20px', padding: '10px 14px', borderLeft: '2px solid var(--risk-high)', backgroundColor: 'var(--risk-high-dim)' }}>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--risk-high)', margin: 0 }}>
                    ERR: {error}
                  </p>
                </div>
              )}

              {/* Connect button */}
              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="btn-accent"
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    opacity: isConnecting ? 0.6 : 1,
                    cursor: isConnecting ? 'not-allowed' : 'pointer',
                    padding: '12px',
                    fontSize: '12px',
                  }}
                >
                  {isConnecting ? '⟳ CONNECTING…' : '⬡ INITIALIZE CONNECTION'}
                </button>
              ) : (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase' }}>
                      Connected Account
                    </p>
                    <div className="data-block" style={{ wordBreak: 'break-all' }}>
                      {account}
                    </div>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    style={{
                      width: '100%',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'var(--risk-high)',
                      border: '1px solid var(--risk-high)',
                      backgroundColor: 'transparent',
                      padding: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    ⏻ Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Benefits ── */}
          <div>
            <p className="section-label" style={{ color: 'var(--accent)', marginBottom: '20px' }}>&nbsp;Why Connect?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {BENEFITS.map((b, i) => (
                <div
                  key={b.label}
                  className="tech-card"
                  style={{ padding: '20px 22px', animationDelay: `${i * 0.06}s` }}
                >
                  <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                    {b.label.toUpperCase()}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.65', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                    {b.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
