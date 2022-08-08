import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Cryptobridges</title>
        <meta name="description" content="Data sets and views on crypto economics" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <p>Graph here</p>
        <Component {...pageProps} />
      </main>
      <footer>
        <p>Footer</p>
      </footer>
    </>
  );
}

export default MyApp;
