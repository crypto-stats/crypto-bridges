import { AnimatePresence, domAnimation, LazyMotion, m } from 'framer-motion';
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

function MyApp({ Component, pageProps, router }: AppProps) {
  return (
    <>
      <HtmlHead />
      <LazyMotion features={domAnimation}>
        <NextNProgress color={GRAPH_COLORS.DEFAULT} height={4} />
        <m.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          <DataProvider data={pageProps.data}>
            <Header />
            <NetworkDiagram />
            <Panel>
              <AnimatePresence exitBeforeEnter>
                <Component {...pageProps} key={router.asPath} />
              </AnimatePresence>
            </Panel>
            <Footer />
          </DataProvider>
        </m.main>
      </LazyMotion>
    </>
  );
}

export default MyApp;
