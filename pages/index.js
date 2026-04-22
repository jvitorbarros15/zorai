import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Link from 'next/link';
import { useBlockchain } from '../contexts/BlockchainContext';
import { useWallet } from '../contexts/WalletContext';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [images, setImages] = useState([]);
  const [highRiskImages, setHighRiskImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    getMediumAndHighRiskImages,
    isLoading: isBlockchainLoading,
    error: blockchainError,
    isContractDeployed,
    lastRefresh,
    currentNetwork,
    switchToBaseSepolia,
  } = useBlockchain();
  const { isConnected } = useWallet();

  useEffect(() => {
    const storedImages = JSON.parse(localStorage.getItem('registeredImages') || '[]');
    setImages(storedImages);
    loadMediumAndHighRiskImages();
  }, [isContractDeployed, lastRefresh]);

  const loadMediumAndHighRiskImages = async () => {
    try {
      if (isContractDeployed) {
        setIsLoading(true);
        const blockchainImages = await getMediumAndHighRiskImages();
        setHighRiskImages(blockchainImages);
      }
    } catch (error) {
      console.error('Error loading medium/high-risk images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (imageId) => {
    const updatedImages = images.filter(image => image.id !== imageId);
    localStorage.setItem('registeredImages', JSON.stringify(updatedImages));
    setImages(updatedImages);
  };

  const filteredImages = images.filter(image =>
    image.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHighRiskImages = highRiskImages.filter(image =>
    image.ipfsHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.modelUsed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSwitchNetwork = async () => {
    try {
      await switchToBaseSepolia();
    } catch (error) {
      console.error('Error switching network:', error);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>

        {/* ── Hero ── */}
        <div style={{ padding: '80px 0 64px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
          {/* Corner decorations */}
          <div style={{ position: 'absolute', top: 24, right: 0, width: '120px', height: '80px', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', opacity: 0.4 }} />
          <div style={{ position: 'absolute', bottom: 24, left: 0, width: '80px', height: '60px', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)', opacity: 0.4 }} />

          <p className="section-label" style={{ color: 'var(--accent)', marginBottom: '20px' }}>
            &nbsp;AI Image Registry Protocol
          </p>

          <h1 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 'clamp(48px, 8vw, 84px)',
            fontWeight: 700,
            lineHeight: '0.95',
            color: 'var(--text-primary)',
            letterSpacing: '0.02em',
            margin: '0 0 24px 0',
          }}>
            VERIFY THE<br />
            <span style={{
              color: 'var(--accent)',
              textShadow: '0 0 40px var(--accent-glow)',
            }}>
              ORIGIN
            </span>{' '}
            <span style={{ color: 'var(--text-secondary)' }}>OF<br />EVERY AI IMAGE.</span>
          </h1>

          <p style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            lineHeight: '1.7',
            maxWidth: '420px',
            margin: '0 0 36px',
            fontFamily: "'Outfit', sans-serif",
          }}>
            Transparent, on-chain verification of AI-generated content.
            Cryptographic fingerprints stored permanently on Base.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/submit" style={{ textDecoration: 'none' }}>
              <span className="btn-accent">+ Register Image</span>
            </Link>
            <Link href="/generate-ai-image" style={{ textDecoration: 'none' }}>
              <span className="btn-accent" style={{ color: 'var(--cyan)', borderColor: 'var(--cyan)' }}>
                ⚡ Generate
              </span>
            </Link>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '32px', marginTop: '48px', flexWrap: 'wrap' }}>
            {[
              { label: 'Registered', value: images.length },
              { label: 'Flagged', value: highRiskImages.length },
              { label: 'Chain', value: 'BASE-84532' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '0.04em' }}>
                  {value}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Network status ── */}
        {isConnected && (
          <div style={{
            padding: '14px 0',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={`status-dot ${currentNetwork?.chainId === BigInt('0x14A34') ? 'online' : 'warning'}`} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                {currentNetwork?.chainId === BigInt('0x14A34')
                  ? 'CONNECTED · Base Sepolia'
                  : 'WRONG NETWORK — Switch required'}
              </span>
            </div>
            {currentNetwork?.chainId !== BigInt('0x14A34') && (
              <button onClick={handleSwitchNetwork} className="btn-accent" style={{ fontSize: '10px', padding: '5px 14px' }}>
                Switch Network
              </button>
            )}
          </div>
        )}

        {/* ── Search ── */}
        <div style={{ padding: '28px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative', maxWidth: '520px' }}>
            <span style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-55%)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14px',
              color: 'var(--accent)',
              userSelect: 'none',
              pointerEvents: 'none',
              opacity: 0.8,
            }}>
              ›
            </span>
            <input
              type="text"
              placeholder="search by image ID or model…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* ── Error ── */}
        {blockchainError && (
          <div style={{
            margin: '28px 0 0',
            padding: '12px 16px',
            borderLeft: '2px solid var(--risk-high)',
            backgroundColor: 'var(--risk-high-dim)',
          }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--risk-high)', margin: 0 }}>
              ERR: {blockchainError}
            </p>
          </div>
        )}

        {/* ── Flagged images ── */}
        <div style={{ padding: '48px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span className="badge badge-danger">Flagged</span>
              <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '0.04em' }}>
                HIGH-RISK BLOCKCHAIN RECORDS
              </h2>
            </div>
            {isLoading && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--text-muted)' }}>
                SCANNING…
              </span>
            )}
          </div>

          {!isContractDeployed ? (
            <div style={{ padding: '16px', borderLeft: '2px solid var(--risk-high)', backgroundColor: 'var(--risk-high-dim)' }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--risk-high)', margin: 0 }}>
                CONTRACT_ERROR: Not deployed — check configuration.
              </p>
            </div>
          ) : filteredHighRiskImages.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', border: '1px solid var(--border)', borderLeft: '2px solid var(--border)' }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.12em', margin: 0 }}>
                // NO FLAGGED RECORDS FOUND
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filteredHighRiskImages.map((image, i) => (
                (() => { console.log('Blockchain image object:', image); return null; })(),
                <div
                  key={image.ipfsHash}
                  className="tech-card tech-card-danger"
                  style={{ padding: '18px 22px', display: 'flex', gap: '18px', alignItems: 'flex-start', animationDelay: `${i * 0.04}s` }}
                >
                  <div style={{
                    width: '54px',
                    height: '54px',
                    flexShrink: 0,
                    border: '1px solid var(--risk-high)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-elevated)',
                    boxShadow: '0 0 8px rgba(255,51,71,0.1)',
                  }}>
                    {image.ipfsHash && (image.ipfsHash.startsWith('Qm') || image.ipfsHash.startsWith('bafy')) ? (
                      <img
                        src={`https://gateway.pinata.cloud/ipfs/${image.ipfsHash}`}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>NULL</span>
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '12px' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {image.ipfsHash?.substring(0, 38)}…
                      </span>
                      <span className="badge badge-danger" style={{ flexShrink: 0 }}>High Risk</span>
                    </div>
                    <div style={{ display: 'flex', gap: '24px', marginBottom: image.riskReasons?.length ? '8px' : 0 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--text-muted)' }}>
                        MODEL:{image.modelUsed}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--text-muted)' }}>
                        {image.timestamp}
                      </span>
                    </div>
                    {image.riskReasons && image.riskReasons.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {image.riskReasons.map((reason, j) => (
                          <span key={j} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--risk-high)', letterSpacing: '0.06em' }}>
                            [{reason}]
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Registered images ── */}
        <div style={{ padding: '48px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span className="badge badge-accent">Registry</span>
              <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '0.04em' }}>
                REGISTERED IMAGES
              </h2>
            </div>
            <Link href="/submit" style={{ textDecoration: 'none' }}>
              <span className="btn-accent" style={{ fontSize: '10px', padding: '6px 14px' }}>
                + Register New
              </span>
            </Link>
          </div>

          {filteredImages.length === 0 ? (
            <div style={{ padding: '64px 0', textAlign: 'center', border: '1px solid var(--border)', borderLeft: '2px solid var(--border)' }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.12em', margin: '0 0 24px' }}>
                // REGISTRY EMPTY
              </p>
              <Link href="/submit" style={{ textDecoration: 'none' }}>
                <span className="btn-accent">+ Register First Image</span>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filteredImages.map((image, i) => (
                <div
                  key={image.id}
                  className="tech-card"
                  style={{ padding: '18px 22px', display: 'flex', gap: '18px', alignItems: 'flex-start', animationDelay: `${i * 0.04}s` }}
                >
                  {image.imageData && (
                    <div style={{
                      width: '54px',
                      height: '54px',
                      flexShrink: 0,
                      border: '1px solid var(--accent)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--bg-elevated)',
                      boxShadow: '0 0 8px var(--accent-glow)',
                    }}>
                      <img
                        src={image.imageData}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '12px' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {image.id?.substring(0, 38)}…
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        <span className={`badge ${image.status === 'Verified' ? 'badge-success' : 'badge-warning'}`}>
                          {image.status}
                        </span>
                        <button
                          onClick={() => handleDelete(image.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: '0',
                            fontSize: '16px',
                            lineHeight: 1,
                            fontFamily: 'monospace',
                            transition: 'color 0.15s',
                          }}
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--text-muted)' }}>
                        MODEL:{image.model}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--text-muted)' }}>
                        {image.date}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
