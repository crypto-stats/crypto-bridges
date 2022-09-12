import Link from 'next/link';
import { IDummyData } from '../data/types';
import styles from '../styles/FlowBox.module.css';
import { format } from '../utils';

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
  data: IDummyData;
  flows: IChainFlow[];
}

const FlowBox = ({ name, logo, flows, data }: IFlowBoxProps) => {
  return (
    <div className={styles.flowsContainer}>
      {flows.map((flow, index) => (
        <div key={index} className={styles.flowBox}>
          <div className={styles.flowBoxTitle}>
            <div className={styles.flowBoxChains}>
              <div className={styles.flowBoxChain}>
                <img src={logo} width={16} height={16} alt="logo" />
                <p>{name}</p>
              </div>
              <div className={styles.flowBoxSpacer} />
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
        </div>
      ))}
    </div>
  );
};

export default FlowBox;
