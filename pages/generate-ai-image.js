import Link from "next/link";
import Layout from "../components/layout/Layout";
export default function Generation() {
  return (
    <Layout title="Image generation prototype">
      <section className="hero compact">
        <span className="eyebrow">Product direction</span>
        <h1>
          The generator was
          <br />a proof of concept.
        </h1>
        <p className="lead">
          ZorAI now focuses on verifying AI provenance through its API and
          public registry.
        </p>
        <p>
          The old generation workflow has been retired. Provider integration
          will capture evidence at the source.
        </p>
        <div className="actions">
          <Link href="/" className="button">
            Verify an image
          </Link>
          <Link href="/submit" className="button secondary">
            Provider workflow
          </Link>
        </div>
      </section>
    </Layout>
  );
}
