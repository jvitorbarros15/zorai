import Link from "next/link";
import Layout from "../components/layout/Layout";
export default function About() {
  return (
    <Layout title="About">
      <section className="hero compact">
        <span className="eyebrow">Why ZorAI</span>
        <h1>
          Evidence people
          <br />
          <span>can inspect.</span>
        </h1>
        <p className="lead">
          A verification API for teams that need to understand an image's
          recorded AI origin.
        </p>
      </section>
      <div className="prose panel">
        <h2>The idea</h2>
        <p>
          Capture provenance from trusted generation workflows, link signed
          claims to exact image bytes, and anchor those claims in a public
          blockchain registry. Businesses pay for convenient verification access
          and structured evidence.
        </p>
        <h2>What blockchain contributes</h2>
        <p>
          It records when an issuer's claim was registered and makes that record
          publicly inspectable. A signature identifies the attesting party.
          Neither technology guarantees that the party is telling the truth:
          issuer approval and source integration are essential.
        </p>
        <h2>Honest limits</h2>
        <p>
          This is a provenance checker, not a universal AI image detector. It
          cannot reliably classify every image on the internet. Metadata may
          disappear during sharing, and resizing or editing changes the file
          digest. No match means unknown.
        </p>
        <h2>Privacy</h2>
        <p>
          The public checker hashes files in your browser and sends only the
          digest. The authenticated API processes uploaded bytes in memory.
          Registration publishes the digest, source claim, model, issuer
          identity and signature as evidence; that evidence and chain records
          are public. Never include prompts or personal data in claim fields.
        </p>
        <p>
          Usage counters, pseudonymous client identifiers and registration jobs
          are stored to enforce quotas and recover transactions. Hosting
          infrastructure may retain request logs; the API does not log keys or
          image bodies. Production retention terms are a launch requirement.
        </p>
        <h2>Current stage</h2>
        <p>
          Pilot software. Paid self-service access, production operations and
          direct provider integrations are still being validated.
        </p>
        <Link href="/docs">Explore the API →</Link>
      </div>
    </Layout>
  );
}
