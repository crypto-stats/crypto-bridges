import type { Variants } from 'framer-motion';
import { AnimatePresence, m } from 'framer-motion';
import Link from 'next/link';
import { IData } from '../data/types';
import styles from '../styles/FlowBox.module.css';
import { format } from '../utils';

const ANIMATIONS: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
};

interface IBridgeFlow {
  name: string;
  logo: string;
  bundle: string;
  value: number;
}

export interface IChainFlow {
  name: string;
  logo: string;
  total: number;
  bridges: IBridgeFlow[];
}

export interface IFlowBoxProps {
  name: string;
  logo: string;
  data: IData;
  flows: IChainFlow[];
}

const FlowBox = ({ name, logo, flows, data }: IFlowBoxProps) => {
  return (
    <div className={styles.flowsContainer}>
      <AnimatePresence>
        {flows.map((flow, index) => (
          <m.div
            key={index}
            className={styles.flowBox}
            initial={'initial'}
            animate={'animate'}
            variants={ANIMATIONS}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
          >
            <div className={styles.flowBoxTitle}>
              <div className={styles.flowBoxChains}>
                <div className={styles.flowBoxChain}>
                  <img src={logo} width={16} height={16} alt="logo" />
                  <p>{name}</p>
                </div>
                <div className={styles.flowBoxSpacer}>
                  <span className={styles.flowBoxSpacerArrow}></span>
                </div>
                <div className={styles.flowBoxChain}>
                  <img
                    src={
                      data.chains.find((chain) => chain.id === flow.name)?.logo
                    }
                    width={16}
                    height={16}
                    alt="logo"
                  />
                  <p>{flow.name}</p>
                </div>
              </div>
              <p>{format(flow.total)}</p>
            </div>
            <div className={styles.flowBoxContent}>
              {flow.bridges.map((bridge, index) => (
                <div key={index} className={styles.flowBoxRow}>
                  <Link
                    passHref
                    scroll={false}
                    href={`/bridges/${bridge.bundle}`}
                  >
                    <a>
                      <div className={styles.flowBoxRowBridge}>
                        <img
                          src={bridge.logo}
                          width={24}
                          height={24}
                          alt="logo"
                        />
                        <p>{bridge.name ?? 'Undefined'}</p>
                      </div>
                      <p>{format(bridge.value)}</p>
                    </a>
                  </Link>
                </div>
              ))}
            </div>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FlowBox;
