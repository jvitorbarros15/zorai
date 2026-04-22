import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';

const NAV = [
  { href: '/', label: 'Archive' },
  { href: '/submit', label: 'Register' },
  { href: '/generate-ai-image', label: 'Generate' },
  { href: '/about', label: 'About' },
  { href: '/docs', label: 'API Docs' },
];

export default function Layout({ children }) {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>ZorAi — AI Image Verification</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="description" content="Verify and register AI-generated images on the blockchain" />
      </Head>

      {/* Top status bar */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '5px 0',
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            SYS:ONLINE
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.18em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Base Sepolia · AI Image Registry Protocol v1.0
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            CHAIN:84532
          </span>
        </div>
      </div>

      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(3, 12, 24, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 1px 0 var(--border), 0 4px 32px rgba(11, 127, 255, 0.06)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>

            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '1px solid var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px var(--accent-glow)',
                flexShrink: 0,
              }}>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '13px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.05em' }}>AI</span>
              </div>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                ZOR<span style={{ color: 'var(--accent)', textShadow: '0 0 12px var(--accent-glow)' }}>AI</span>
              </span>
            </Link>

            {/* Nav */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`nav-link${router.pathname === href ? ' active' : ''}`}
                >
                  {label}
                </Link>
              ))}

              <Link href="/connect" style={{ textDecoration: 'none' }}>
                <span className="btn-accent">
                  ⬡ Connect
                </span>
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom accent line */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--accent), var(--cyan), var(--accent), transparent)',
          opacity: 0.4,
        }} />
      </header>

      {/* Main */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '28px', height: '28px', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '11px', fontWeight: 700, color: 'var(--accent)' }}>AI</span>
                </div>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                  ZOR<span style={{ color: 'var(--accent)' }}>AI</span>
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.7', maxWidth: '260px', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                Decentralized AI image verification.<br />
                Proof of provenance, permanently on-chain.
              </p>
            </div>
            <div>
              <p className="section-label" style={{ color: 'var(--text-muted)', marginBottom: '14px', marginTop: 0 }}>Links</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a href="https://github.com/jvitorbarros15/zorai" target="_blank" rel="noopener noreferrer" className="footer-link">
                  GitHub Repository ↗
                </a>
                <a href="https://testnet.bscscan.com/address/0x47adc07617d59984ea5da9d59d3f3a0882737556" target="_blank" rel="noopener noreferrer" className="footer-link">
                  Smart Contract ↗
                </a>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '36px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--text-muted)' }}>
              © 2025 ZorAi Protocol
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.18em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Decentralized · Immutable · Verifiable
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
