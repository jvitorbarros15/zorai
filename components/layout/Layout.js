import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";

const NAV = [
  ["/", "Verify"],
  ["/docs", "Developer API"],
  ["/submit", "Providers"],
  ["/about", "About"],
];
export default function Layout({
  children,
  title = "AI provenance verification",
}) {
  const router = useRouter();
  return (
    <div className="shell">
      <Head>
        <title>{title + " | ZorAI"}</title>
        <meta
          name="description"
          content="Check signed AI provenance against a public blockchain record. Verification tools for people and developers."
        />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <header>
        <div className="header-inner">
          <Link href="/" className="brand">
            ZOR<span>AI</span>
          </Link>
          <nav aria-label="Main navigation">
            {NAV.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                aria-current={router.pathname === href ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <Link href="/connect" className="button secondary">
            API console
          </Link>
        </div>
      </header>
      <main id="main" className="container">
        {children}
      </main>
      <footer className="container">
        <div>
          <strong>ZorAI</strong>
          <p>Signed provenance. Public records. Clear limits.</p>
        </div>
        <div>
          <span className="badge">Pilot software</span>
          <p>
            <a href="https://github.com/jvitorbarros15/zorai">
              Source & release progress
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
