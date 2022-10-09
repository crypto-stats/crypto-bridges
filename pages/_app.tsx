import type { AppProps } from 'next/app';
import NextNProgress from 'nextjs-progressbar';
import Footer from '../components/Footer';
import Header from '../components/Header';
import HtmlHead from '../components/Heading';
import NetworkDiagram from '../components/NetworkDiagram';
import Panel from '../components/Panel';
import { GRAPH_COLORS } from '../constants';
import '../styles/globals.css';

import Router from 'next/router';
import { DataProvider } from '../data/data-context';

const routeChange = () => {
  // Temporary fix to avoid flash of unstyled content
  // during route transitions. Keep an eye on this
  // issue and remove this code when resolved:
  // https://github.com/vercel/next.js/issues/17464

  const tempFix = () => {
    const allStyleElems = document.querySelectorAll('style[media="x"]');
    allStyleElems.forEach((elem) => {
      elem.removeAttribute('media');
    });
  };
  tempFix();
};

Router.events.on('routeChangeComplete', routeChange);
Router.events.on('routeChangeStart', routeChange);

const simplePages = ['/404', '/_error'];

function MyApp({ Component, pageProps, router }: AppProps) {
  if (simplePages.includes(router.pathname)) {
    return (
      <>
        <Component {...pageProps} />
      </>
    );
  }

  if (!pageProps.data) {
    throw new Error(`No data available on ${router.pathname}`);
  }

  return (
    <>
      <HtmlHead />
      <NextNProgress
        color={GRAPH_COLORS.DEFAULT}
        height={4}
        options={{ trickle: false, showSpinner: false }}
      />
      <main>
        <DataProvider data={pageProps.data}>
          <Header />
          <NetworkDiagram />
          <Panel>
            <Component {...pageProps} />
          </Panel>
          <Footer />
        </DataProvider>
      </main>
    </>
  );
}

export default MyApp;
