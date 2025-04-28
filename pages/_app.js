import { WalletProvider } from '../contexts/WalletContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <WalletProvider>
      <Component {...pageProps} />
    </WalletProvider>
  );
}

export default MyApp; 