import { WalletProvider } from '../contexts/WalletContext';
import { BlockchainProvider } from '../contexts/BlockchainContext';
import { Analytics } from '@vercel/analytics/next';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <WalletProvider>
      <BlockchainProvider>
        <Component {...pageProps} />
        <Analytics />
      </BlockchainProvider>
    </WalletProvider>
  );
}

export default MyApp; 