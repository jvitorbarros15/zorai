import Link from "next/link";
import Layout from "../components/layout/Layout";
export default function Providers() {
  return (
    <Layout title="Provider integration">
      <section className="hero compact">
        <span className="eyebrow">Approved issuer program</span>
        <h1>
          Provenance starts
          <br />
          <span>at the source.</span>
        </h1>
        <p className="lead">
          Registration requires an approved issuer signature tied to the final
          image bytes.
        </p>
      </section>
      <div className="grid">
        <section className="panel">
          <h2>Connect a trusted source</h2>
          <ol>
            <li>
              Validate the integration's identity and access to the generation
              process.
            </li>
            <li>Approve its signing address and allowed sources.</li>
            <li>
              Add a ZorAI marker, calculate the final file digest, and sign the
              claim.
            </li>
            <li>
              Submit the image and evidence using an issuer-scoped API key.
            </li>
            <li>
              Wait for a confirmed receipt, then publish the exact prepared
              file.
            </li>
          </ol>
          <Link className="button" href="/docs#registration">
            Registration guide
          </Link>
        </section>
        <section className="panel">
          <h2>Integration status</h2>
          <p>
            The signed issuer workflow is available in the repository for pilot
            testing. Direct Midjourney, Sora and OpenAI source integrations have
            not been connected.
          </p>
          <p>
            Ordinary EXIF or XMP labels are editable. Uploading an image and
            naming a model does not establish its origin.
          </p>
          <p>
            Existing signed C2PA credentials must be preserved. Independent C2PA
            validation and credential-preserving ingestion remain release work.
          </p>
        </section>
      </div>
    </Layout>
  );
}
