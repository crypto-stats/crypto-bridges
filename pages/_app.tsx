import type { AppProps } from 'next/app';
import Header from '../components/Header';
import HtmlHead from '../components/Heading';
import NetworkDiagram from '../components/NetworkDiagram';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <HtmlHead />
      <main>
        <Header />
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
