import type { ReactElement } from 'react';
import { IData } from '../data/types';
import { useStore } from '../store';
import styles from '../styles/NodeSpecifics.module.css';
import { format } from '../utils';
import DataBox from './DataBox';
import FlowBox, { IChainFlow } from './FlowBox';

interface IBridgeProps {
  data: IData;
  chainId: string;
}

const ChainSpecifics = ({ data, chainId }: IBridgeProps): ReactElement => {
  const isImport = useStore((state) => state.flowsShowImport);

  const findChain = (id: string) => data.chains.find(chain => chain.id === id);
  const getChainName = (id: string) => {
    const chain = findChain(id);
    if (!chain) {
      return null;
    }
    return chain.name || chain.id.charAt(0).toUpperCase() + chain.id.substring(1);
  }

  const chain = findChain(chainId);
  if (chain === undefined) return <div>Empty!</div>;

  const chainName = getChainName(chainId);

  const computeTVLForChain = () => {
    let tvl = 0;
    data.flows.forEach((flow) => {
      if (flow.metadata.chainA === chainId)
        tvl += flow.results.currentValueBridgedAToB ?? 0;
      if (flow.metadata.chainB === chainId)
        tvl += flow.results.currentValueBridgedBToA ?? 0;
    });
    return format(tvl);
  };
  const computeChainFlows = () => {
    const flows: IChainFlow[] = [];
    data.flows.forEach((flow) => {
      const isA = flow.metadata.chainA === chainId;
      const isB = flow.metadata.chainB === chainId;
      if (!(isA || isB)) {
        return;
      }
      const bridge = {
        name: flow.metadata.name,
        bundle: flow.bundle,
        logo:
          data.bridges.find((bridge) => bridge.id === flow.bundle)?.metadata
            .icon ?? '',
        value:
          (isA
            ? isImport
              ? flow.results.currentValueBridgedBToA
              : flow.results.currentValueBridgedAToB
            : isB
            ? isImport
              ? flow.results.currentValueBridgedAToB
              : flow.results.currentValueBridgedBToA
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
          name: getChainName(isA ? flow.metadata.chainB : flow.metadata.chainA) || 'Unknown',
          logo: findChain(isA ? flow.metadata.chainB : flow.metadata.chainA)?.logo ?? '',
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
          <img src={chain.logo} width={30} height={30} alt="logo" />
          <p className={styles.nodeName}>{chainName}</p>
        </div>
        {chain.description && <p>{chain.description}</p>}
        {chain.website && <a href={chain.website}>Website</a>}
      </div>
      <div className={styles.nodeItem}>
        <DataBox caption="Total value bridged" value={computeTVLForChain()} />
      </div>
      <div className={styles.nodeItem}>
        <FlowBox
          data={data}
          logo={chain.logo}
          name={chainName || 'Unknown'}
          flows={computeChainFlows()}
        />
      </div>
    </div>
  );
};

export default ChainSpecifics;
