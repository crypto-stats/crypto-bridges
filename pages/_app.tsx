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

function MyApp({ Component, pageProps, router }: AppProps) {
  return (
    <>
      <HtmlHead />
      <LazyMotion features={domAnimation}>
        <NextNProgress color={GRAPH_COLORS.DEFAULT} height={4} />
        <AnimatePresence exitBeforeEnter>
          <m.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <Header />
            <NetworkDiagram />
            <Panel>
              <Component {...pageProps} key={router.asPath} />
            </Panel>
            <Footer />
          </m.main>
        </AnimatePresence>
      </LazyMotion>
    </>
  );
}

export default MyApp;
