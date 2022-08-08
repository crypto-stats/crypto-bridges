import type { AppProps } from 'next/app';
import HtmlHead from '../components/Heading';
import NetworkDiagram from '../components/NetworkDiagram';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <HtmlHead />
      <main>
        <h1>Crypto bridges</h1>
        <NetworkDiagram />
        <Component {...pageProps} />
      </main>
      <footer>
        <p>Footer</p>
      </footer>
    </>
  );
}

export default MyApp;
