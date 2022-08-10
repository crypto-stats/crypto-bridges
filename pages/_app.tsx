import { AnimatePresence, domAnimation, LazyMotion, m } from 'framer-motion';
import type { AppProps } from 'next/app';
import NextNProgress from 'nextjs-progressbar';
import Content from '../components/Content';
import Footer from '../components/Footer';
import Header from '../components/Header';
import HtmlHead from '../components/Heading';
import NetworkDiagram from '../components/NetworkDiagram';
import { ORANGE_1 } from '../constants';
import '../styles/globals.css';

function MyApp({ Component, pageProps, router }: AppProps) {
  return (
    <>
      <HtmlHead />
      <NextNProgress color={ORANGE_1} height={4} />
      <LazyMotion features={domAnimation}>
        <AnimatePresence exitBeforeEnter>
          <m.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <Header />
            <NetworkDiagram />
            <Content>
              <Component {...pageProps} key={router.asPath} />
            </Content>
            <Footer />
          </m.main>
        </AnimatePresence>
      </LazyMotion>
    </>
  );
}

export default MyApp;
