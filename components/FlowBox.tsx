import Link from 'next/link';
import { useStore } from '../store';
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
  flows: IChainFlow[];
}

const FlowBox = ({ name, logo, flows }: IFlowBoxProps) => {
  const isImport = useStore((state) => state.flowsShowImport);
  const minValue = flows[flows.length - 1]?.total;
  const maxValue = flows[0]?.total;
  return (
    <div className={styles.flowsContainer}>
      {flows.map((flow, index) => (
        <div key={`${index}-${flow.total}`} className={styles.flowBox}>
          <div className={styles.flowBoxTitle}>
            <div
              className={
                isImport ? styles.flowBoxChainsReverse : styles.flowBoxChains
              }
            >
              <div className={styles.flowBoxChain}>
                <img src={logo} width={16} height={16} alt="logo" />
                <p>{name}</p>
              </div>
              <div className={styles.flowBoxSpacer}>
                <span className={styles.flowBoxSpacerArrow}></span>
              </div>
              <div className={styles.flowBoxChain}>
                <img src={flow.logo} width={16} height={16} alt="logo" />
                <p>{flow.name}</p>
              </div>
            </div>
            <div className={styles.flowBoxMainFlow}>
              <span
                className={styles.valueBar}
                style={{
                  width: `${Math.round(
                    (100 * (flow.total - minValue)) / (maxValue - minValue),
                  )}%`,
                }}
              />
              <p>{format(flow.total)}</p>
            </div>
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
