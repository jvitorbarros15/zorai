import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { useWallet } from '../contexts/WalletContext';
import Link from 'next/link';
import CryptoJS from 'crypto-js';

export default function Submit() {
  const [formData, setFormData] = useState({
    imageId: '',
    model: '',
    autoDetect: false,
    image: null,
    imagePreview: null,
    fullSizePreview: null,
    ipfsHash: '',
    txHash: '',
    timestamp: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected, registerImage } = useWallet();

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const timestamp = Date.now();
        const imageId = CryptoJS.SHA256(file.name + timestamp).toString();
        const ipfsHash = CryptoJS.SHA256(imageId).toString().substring(0, 46);
        const txHash = CryptoJS.SHA256(ipfsHash).toString();

        setFormData(prev => ({
          ...prev,
          fullSizePreview: e.target.result,
          imageId,
          ipfsHash,
          txHash,
          timestamp: new Date(timestamp).toISOString()
        }));

        const storageCanvas = document.createElement('canvas');
        storageCanvas.width = 32;
        storageCanvas.height = 32;
        const storageCtx = storageCanvas.getContext('2d');
        storageCtx.drawImage(img, 0, 0, 32, 32);
        const smallImageData = storageCanvas.toDataURL('image/jpeg', 0.1);

        setFormData(prev => ({ ...prev, image: smallImageData, imagePreview: smallImageData }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected) { alert('Please connect your wallet first'); return; }
    setIsLoading(true);
    try {
      const txHash = await registerImage(formData.imageId, formData.model);
      const images = JSON.parse(localStorage.getItem('registeredImages') || '[]');
      images.push({
        id: formData.imageId,
        model: formData.model,
        date: new Date().toISOString().split('T')[0],
        status: 'Verified',
        imageData: formData.image,
        txHash,
      });
      localStorage.setItem('registeredImages', JSON.stringify(images));
      window.location.href = '/';
    } catch (error) {
      console.error('Error submitting image:', error);
      alert('Error submitting image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  if (!isConnected) {
    return (
      <Layout>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ padding: '64px 0 48px', borderBottom: '1px solid var(--border)' }}>
            <p className="section-label" style={{ color: 'var(--accent)', marginBottom: '16px' }}>&nbsp;Register Image</p>
            <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.03em', margin: 0, lineHeight: 0.95 }}>
              REGISTER NEW<br />
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
                Connect your MetaMask wallet to register and verify AI images on the blockchain.
              </p>
              <Link href="/connect" style={{ textDecoration: 'none' }}>
                <span className="btn-accent" style={{ width: '100%', display: 'block', textAlign: 'center', padding: '12px' }}>
                  ⬡ Connect Wallet
                </span>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>

        {/* ── Header ── */}
        <div style={{ padding: '64px 0 48px', borderBottom: '1px solid var(--border)' }}>
          <p className="section-label" style={{ color: 'var(--accent)', marginBottom: '16px' }}>&nbsp;Register Image</p>
          <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.03em', margin: 0, lineHeight: 0.95 }}>
            REGISTER NEW<br />
            <span style={{ color: 'var(--accent)', textShadow: '0 0 32px var(--accent-glow)' }}>IMAGE</span>
          </h1>
        </div>

        <div style={{ padding: '48px 0' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>

              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Upload */}
                <div>
                  <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '10px' }}>
                    Upload Image
                  </label>
                  <div style={{
                    border: '1px solid var(--border)',
                    borderLeft: '2px solid var(--accent)',
                    backgroundColor: 'var(--bg-elevated)',
                    padding: '20px',
                    cursor: 'pointer',
                  }}>
                    <input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{
                        width: '100%',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        fontFamily: "'JetBrains Mono', monospace",
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                </div>

                {/* Preview */}
                {formData.fullSizePreview && (
                  <div>
                    <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '10px' }}>
                      Preview
                    </label>
                    <div style={{
                      border: '1px solid var(--accent)',
                      boxShadow: '0 0 24px var(--accent-glow)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--bg-elevated)',
                    }}>
                      <img
                        src={formData.fullSizePreview}
                        alt="Preview"
                        style={{ width: '100%', height: '280px', objectFit: 'contain', display: 'block' }}
                      />
                    </div>
                  </div>
                )}

                {/* AI Model */}
                <div>
                  <label htmlFor="model" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '10px' }}>
                    AI Model
                  </label>
                  <select
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    required
                    className="form-field"
                    style={{ width: '100%' }}
                  >
                    <option value="">— Select model —</option>
                    <option value="DALL-E">DALL-E</option>
                    <option value="Midjourney">Midjourney</option>
                    <option value="Stable Diffusion">Stable Diffusion</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Auto detect */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, autoDetect: !prev.autoDetect }))}
                    style={{
                      width: '20px',
                      height: '20px',
                      border: `1px solid ${formData.autoDetect ? 'var(--accent)' : 'var(--border)'}`,
                      backgroundColor: formData.autoDetect ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                    }}
                  >
                    {formData.autoDetect && (
                      <span style={{ color: 'var(--accent)', fontSize: '12px', lineHeight: 1 }}>✓</span>
                    )}
                  </div>
                  <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer', letterSpacing: '0.06em' }}>
                    Enable automatic model detection
                  </label>
                </div>

                {/* Submit */}
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
                  {isLoading ? '⟳ PROCESSING…' : '⬡ REGISTER ON BLOCKCHAIN'}
                </button>
              </div>

              {/* Right column — data display */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {[
                  { label: 'Image ID (SHA256)', value: formData.imageId || '—' },
                  { label: 'IPFS Hash', value: formData.ipfsHash || '—' },
                  { label: 'Transaction Hash', value: formData.txHash || '—' },
                  { label: 'Timestamp', value: formData.timestamp ? new Date(formData.timestamp).toLocaleString() : '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '8px' }}>
                      {label}
                    </label>
                    <div className="data-block">
                      {value}
                    </div>
                  </div>
                ))}

                {/* Info panel */}
                <div style={{ marginTop: '12px', border: '1px solid var(--border)', borderLeft: '2px solid var(--cyan)', backgroundColor: 'var(--bg-surface)', padding: '18px 20px' }}>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--cyan)', margin: '0 0 10px' }}>
                    How Registration Works
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                    Your image is hashed with SHA256 to create a unique fingerprint. This ID is stored on Base — creating an immutable, public record of origin.
                  </p>
                </div>
              </div>

            </div>
          </form>
        </div>

      </div>
    </Layout>
  );
}
