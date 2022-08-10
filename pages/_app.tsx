import { AnimatePresence, domAnimation, LazyMotion, m } from 'framer-motion';
import type { AppProps } from 'next/app';
import NextNProgress from 'nextjs-progressbar';
import { FlexOrienter } from '../components/FlexOrienter';
import Footer from '../components/Footer';
import Header from '../components/Header';
import HtmlHead from '../components/Heading';
import NetworkDiagram from '../components/NetworkDiagram';
import Panel from '../components/Panel';
import { ORANGE_1 } from '../constants';
import '../styles/globals.css';

function MyApp({ Component, pageProps, router }: AppProps) {
  return (
    <>
      <HtmlHead />
      <LazyMotion features={domAnimation}>
        <NextNProgress color={ORANGE_1} height={4} />
        <AnimatePresence exitBeforeEnter>
          <m.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <Header />
            <FlexOrienter>
              <NetworkDiagram />
              <Panel>
                <Component {...pageProps} key={router.asPath} />
              </Panel>
            </FlexOrienter>
            <Footer />
          </m.main>
        </AnimatePresence>
      </LazyMotion>
    </>
  );
}

export default MyApp;
