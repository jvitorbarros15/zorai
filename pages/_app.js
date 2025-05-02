import { WalletProvider } from '../contexts/WalletContext';
import { BlockchainProvider } from '../contexts/BlockchainContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <WalletProvider>
      <BlockchainProvider>
        <Component {...pageProps} />
      </BlockchainProvider>
    </WalletProvider>
  );
}

export default MyApp; 