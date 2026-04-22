import Layout from '../components/layout/Layout';
import Link from 'next/link';

const STEPS = [
  {
    n: '01',
    title: 'IMAGE IS CREATED BY AI',
    body: 'An image is generated using an AI tool (DALL·E, Midjourney, Stable Diffusion, etc.), either directly through ZorAi or any other platform.',
  },
  {
    n: '02',
    title: 'UNIQUE IMAGE ID IS GENERATED',
    body: 'ZorAi automatically generates a unique cryptographic ID using SHA256 hashing. The ID is derived from the prompt, timestamp, and model — creating a reliable fingerprint of the image\'s origin.',
  },
  {
    n: '03',
    title: 'CONTENT RISK FILTER',
    body: 'Before registration, ZorAi runs the image through a risk analysis pipeline to detect potential for misinformation or sensitive content. Only high-impact images are flagged on-chain.',
    optional: true,
  },
  {
    n: '04',
    title: 'ID REGISTERED ON BLOCKCHAIN',
    body: 'If the image passes the filter, its unique ID is stored on-chain via a smart contract, creating a permanent record with public visibility and proof of provenance.',
  },
  {
    n: '05',
    title: 'ANYONE CAN VERIFY IT',
    body: 'Users can input an image ID to verify whether it has been registered, when it was created, and which model generated it — all from a trustless, decentralized source.',
  },
];

export default function About() {
  return (
    <Layout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>

        {/* ── Hero ── */}
        <div style={{ padding: '80px 0 64px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 24, right: 0, width: '100px', height: '70px', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', opacity: 0.4 }} />

          <p className="section-label" style={{ color: 'var(--accent)', marginBottom: '20px' }}>
            &nbsp;About ZorAi
          </p>
          <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.03em', margin: '0 0 20px', lineHeight: 0.95 }}>
            DECENTRALIZED AI<br />
            <span style={{ color: 'var(--accent)', textShadow: '0 0 32px var(--accent-glow)' }}>IMAGE VERIFICATION</span>
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: '1.75', maxWidth: '580px', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
            For a trustworthy digital world.
          </p>
        </div>

        {/* ── What is ZorAi ── */}
        <div style={{ padding: '56px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '48px', alignItems: 'start' }}>
            <div>
              <p className="section-label" style={{ color: 'var(--accent)', marginBottom: '12px' }}>&nbsp;Mission</p>
              <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '0.04em' }}>
                WHAT IS ZORAI?
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {[
                'ZorAi is a decentralized application designed to verify and register AI-generated image IDs on the blockchain. Our platform brings transparency, traceability, and trust to the world of generative AI by allowing anyone to check whether a visual asset was created by artificial intelligence — and if so, when, how, and by whom.',
                'In a digital era where misinformation spreads fast and AI-generated visuals are increasingly indistinguishable from real ones, ZorAi serves as a trust layer, enabling creators, platforms, and users to authenticate the origin of AI-generated content through a public, immutable record.',
                'ZorAi is built for developers, creators, journalists, and platforms who believe in the importance of accountability and digital integrity in the age of artificial intelligence.',
              ].map((text, i) => (
                <p key={i} style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.75', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                  {text}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* ── How it works ── */}
        <div style={{ padding: '56px 0', borderBottom: '1px solid var(--border)' }}>
          <p className="section-label" style={{ color: 'var(--accent)', marginBottom: '12px' }}>&nbsp;Protocol</p>
          <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 48px', letterSpacing: '0.04em' }}>
            HOW IT WORKS
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {STEPS.map((step, i) => (
              <div
                key={step.n}
                className="tech-card"
                style={{
                  padding: '24px 28px',
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr',
                  gap: '24px',
                  alignItems: 'start',
                  animationDelay: `${i * 0.07}s`,
                }}
              >
                <div>
                  <span style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '42px',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    lineHeight: 1,
                    textShadow: '0 0 20px var(--accent-glow)',
                    display: 'block',
                  }}>
                    {step.n}
                  </span>
                  {step.optional && (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      optional
                    </span>
                  )}
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.05em', margin: '0 0 10px' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.75', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div style={{ padding: '64px 0', textAlign: 'center' }}>
          <p className="section-label" style={{ color: 'var(--accent)', justifyContent: 'center', marginBottom: '20px' }}>&nbsp;Get Started</p>
          <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '36px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em', margin: '0 0 12px' }}>
            READY TO VERIFY?
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: '0 0 36px', fontFamily: "'Outfit', sans-serif" }}>
            Connect your wallet and register your first AI-generated image on the blockchain.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/connect" style={{ textDecoration: 'none' }}>
              <span className="btn-accent">⬡ Connect Wallet</span>
            </Link>
            <Link href="/submit" style={{ textDecoration: 'none' }}>
              <span className="btn-accent" style={{ color: 'var(--cyan)', borderColor: 'var(--cyan)' }}>+ Register Image</span>
            </Link>
          </div>
        </div>

      </div>
    </Layout>
  );
}
