import Image from 'next/image';
import type { ReactElement } from 'react';
import { IDummyData } from '../data/types';
import styles from '../styles/NodeSpecifics.module.css';
import { format } from '../utils';
import DataBox from './DataBox';
import FlowBox, { IChainFlow } from './FlowBox';

interface IBridgeProps {
  data: IDummyData;
  name: string;
}

const ChainSpecifics = ({ data, name }: IBridgeProps): ReactElement => {
  const chainName = name.split('-').join(' ');
  const chain = data.chains.find((chain) => chain.name === name);
  if (chain === undefined) return <div>Empty!</div>;
  const computeTVLForChain = () => {
    let tvl = 0;
    data.flows.forEach((flow) => {
      if (flow.metadata.chainA === name)
        tvl += flow.results.currentValueBridgedAToB ?? 0;
      if (flow.metadata.chainB === name)
        tvl += flow.results.currentValueBridgedBToA ?? 0;
    });
    return format(tvl);
  };
  const computeChainFlows = () => {
    const flows: IChainFlow[] = [];
    data.flows.forEach((flow) => {
      const isA = flow.metadata.chainA === name;
      const isB = flow.metadata.chainB === name;
      if (!(isA || isB)) {
        return;
      }
      const bridge = {
        name: flow.metadata.name.toLowerCase(),
        bundle: flow.bundle,
        logo:
          data.bridges.find((bridge) => bridge.id === flow.bundle)?.metadata
            .icon ?? '',
        value:
          (isA
            ? flow.results.currentValueBridgedAToB
            : isB
            ? flow.results.currentValueBridgedBToA
            : 0) ?? 0,
      };
      if (bridge.value === 0) {
        return;
      }
      const otherChainIndex = flows.findIndex(
        (item) =>
          item.name === (isA ? flow.metadata.chainB : flow.metadata.chainA),
      );
      if (otherChainIndex === -1) {
        flows.push({
          name: isA ? flow.metadata.chainB : flow.metadata.chainA,
          logo:
            data.chains.find(
              (item) =>
                item.name ===
                (isA ? flow.metadata.chainB : flow.metadata.chainA),
            )?.logo ?? '',
          total: bridge.value,
          bridges: [bridge],
        });
      } else {
        flows[otherChainIndex].bridges.push(bridge);
        flows[otherChainIndex].total += bridge.value;
      }
    });
    return flows.sort((a, b) => b.total - a.total);
  };
  return (
    <div className={styles.nodeSpecifics}>
      <div className={styles.nodeItem}>
        <h2>chain</h2>
      </div>
      <div className={styles.nodeItem}>
        <div className={styles.nodeInfo}>
          <Image src={chain.logo} width={30} height={30} alt="logo" />
          <p className={styles.nodeName}>{chainName}</p>
        </div>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      </div>
      <div className={styles.nodeItem}>
        <DataBox caption="Total value bridged" value={computeTVLForChain()} />
      </div>
      <div className={styles.nodeItem}>
        <FlowBox
          logo={chain.logo}
          name={chainName}
          flows={computeChainFlows()}
        />
      </div>
    </div>
  );
};

export default ChainSpecifics;
