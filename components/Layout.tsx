import { AnimatePresence, domAnimation, LazyMotion, m } from 'framer-motion';
import NextNProgress from 'nextjs-progressbar';
import Footer from '../components/Footer';
import Header from '../components/Header';
import NetworkDiagram from '../components/NetworkDiagram';
import Panel from '../components/Panel';
import { GRAPH_COLORS } from '../constants';
import { INode } from '../utils';

export default function Layout({ children, data }: { children: React.ReactNode, data: INode[] }) {
  return (
    <LazyMotion features={domAnimation}>
      <NextNProgress color={GRAPH_COLORS.DEFAULT} height={4} />
      <m.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        <Header />
        <NetworkDiagram data={data} />
        <Panel>
          <AnimatePresence exitBeforeEnter>
            {children}
          </AnimatePresence>
        </Panel>
        <Footer />
      </m.main>
    </LazyMotion>
  );
}
