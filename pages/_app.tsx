import type { AppProps } from 'next/app';
import NextNProgress from 'nextjs-progressbar';
import Header from '../components/Header';
import HtmlHead from '../components/Heading';
import NetworkDiagram from '../components/NetworkDiagram';
import { ORANGE_1 } from '../constants';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <HtmlHead />
      <main>
        <NextNProgress color={ORANGE_1} height={4} />
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
