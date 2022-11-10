import Link from 'next/link';
import { ReactElement, useMemo } from 'react';
import { ISecurityData } from '../data/security-data';
import { IData } from '../data/types';
import { useStore } from '../store';
import styles from '../styles/Chain.module.css';
import { format } from '../utils';
import BountyBox from './BountyBox';
import DataBox from './DataBox';
import FlowBox, { IChainFlow } from './FlowBox';
import SocialTags from './SocialTags';

interface IBridgeProps {
  data: IData;
  chainId: string;
  securityData: ISecurityData | null;
}

const Chain = ({ data, chainId, securityData }: IBridgeProps): ReactElement => {
  const isImport = useStore((state) => state.flowsShowImport);

  const { exportedValue, importedValue } = useMemo(() => {
    let exported = 0,
      imported = 0;
    data.flows.forEach((flow) => {
      if (flow.metadata.chainA === chainId) {
        exported += flow.results.currentValueBridgedAToB ?? 0;
        imported += flow.results.currentValueBridgedBToA ?? 0;
      }
      if (flow.metadata.chainB === chainId) {
        exported += flow.results.currentValueBridgedBToA ?? 0;
        imported += flow.results.currentValueBridgedAToB ?? 0;
      }
    });
    const exportedValue = format(exported);
    const importedValue = format(imported);
    return { exportedValue, importedValue };
  }, [data, chainId]);

  const findChain = (id: string) =>
    data.chains.find((chain) => chain.id === id);
  const getChainName = (id: string) => {
    const chain = findChain(id);
    if (!chain) {
      return null;
    }
    return (
      chain.name || chain.id.charAt(0).toUpperCase() + chain.id.substring(1)
    );
  };

  const chain = findChain(chainId);
  if (chain === undefined) return <div>Empty!</div>;

  const chainName = getChainName(chainId);

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
      const otherChainIndex = flows.findIndex((item) => {
        const currentChainName = isA
          ? flow.metadata.chainB
          : flow.metadata.chainA;
        const capitalizedChainName =
          currentChainName[0].toUpperCase() + currentChainName.substring(1);
        return item.name === capitalizedChainName;
      });
      if (otherChainIndex === -1) {
        flows.push({
          name:
            getChainName(isA ? flow.metadata.chainB : flow.metadata.chainA) ||
            'Unknown',
          logo:
            findChain(isA ? flow.metadata.chainB : flow.metadata.chainA)
              ?.logo ?? '',
          total: bridge.value,
          bridges: [bridge],
        });
      } else {
        flows[otherChainIndex].bridges.push(bridge);
        flows[otherChainIndex].total += bridge.value;
        flows[otherChainIndex].bridges.sort((a, b) => b.value - a.value);
      }
    });
    return flows.sort((a, b) => b.total - a.total);
  };

  return (
    <div className={styles.nodeSpecifics}>
      <SocialTags
        title={chainName}
        description={chain.description}
      />

      <div className={styles.nodeItem}>
        <h2>chain</h2>
      </div>
      <div className={styles.nodeItem}>
        <div className={styles.nodeInfo}>
          <img src={chain.logo} width={30} height={30} alt="logo" />
          <p className={styles.nodeName}>{chainName}</p>
          {chain.website && (
            <Link passHref href={chain.website}>
              <a className={styles.link}>
                <img src="/website.svg" alt="Website" width={24} height={24} />
              </a>
            </Link>
          )}
        </div>
        {chain.description && <p>{chain.description}</p>}
      </div>

      {securityData && <BountyBox id={chainId} securityData={securityData} />}

      <div className={styles.nodeItem}>
        <DataBox
          caption={`Total value ${isImport ? 'imported' : 'exported'}`}
          value={isImport ? importedValue : exportedValue}
        />
      </div>
      <div className={styles.nodeItem}>
        <FlowBox
          logo={chain.logo}
          name={chainName || 'Unknown'}
          flows={computeChainFlows()}
        />
      </div>
    </div>
  );
};

export default Chain;
