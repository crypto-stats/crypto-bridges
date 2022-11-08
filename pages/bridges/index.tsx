import type { NextPage } from 'next';
import { useEffect, useMemo, useState } from 'react';
import BridgeTable from '../../components/BridgeTable';
import Motion from '../../components/Motion';
import SocialTags from '../../components/SocialTags';
import { loadData } from '../../data/load-data';
import { IData } from '../../data/types';
import styles from '../../styles/index.module.css';
import { convertDataForGraph, IBridgeLink, needsLandscape } from '../../utils';

const DEFAULT_MAX_ELEMENTS = 4;

interface IBridgeProps {
  data: IData;
  date: string;
}

type IBridge = { id: string; name: string; tvl: number; logo: string };
type SubBridge = {
  id: string;
  name: string;
  tvl: number;
  logo: string;
  chain1Name: string;
  chain1Logo?: string;
  chain2Name: string;
  chain2Logo?: string;
};

const Bridges: NextPage<IBridgeProps> = ({ data, date }) => {
  console.log(`Data for bridge page collected on ${date}`);
  const convertedData = convertDataForGraph(data);
  const [displayLimit, setDisplayLimit] = useState(DEFAULT_MAX_ELEMENTS);
  const { bridges, subBridges } = useMemo(() => {
    const bridges: IBridge[] = [];
    const bridgesById: { [id: string]: IBridge } = {};
    const subBridges: SubBridge[] = [];
    const subBridgesById: { [id: string]: SubBridge } = {};
    const getBridgeName = (id: string) => data.bridges.find(bridge => bridge.id === id)?.metadata.name || id;
    const getChainName = (id: string) => data.chains.find(chain => chain.id === id)?.name || id;

    convertedData.links.forEach((x) => {
      const link = x as unknown as IBridgeLink;
      if (link.bridge === undefined) return;

      if (!bridgesById[link.bridge]) {
        const bridge: IBridge = {
          name: getBridgeName(link.bridge),
          id: link.bridge,
          tvl: link.flow,
          logo: link.logo,
        };
        bridges.push(bridge);
        bridgesById[link.bridge] = bridge;
      } else {
        bridgesById[link.bridge].tvl += link.flow;
      }

      const id = `${link.bridge}-${link.source}-${link.target}`;
      if (!subBridgesById[id]) {
        const subBridge = {
          name: `${getBridgeName(link.bridge)}: ${getChainName(link.source)} - ${getChainName(link.target)}`,
          id: link.bridge,
          tvl: link.flow,
          logo: link.logo,
          chain1Name: link.source,
          chain1Logo: data.chains.find((chain) => chain.id === link.source)
            ?.logo,
          chain2Name: link.target,
          chain2Logo: data.chains.find((chain) => chain.id === link.target)
            ?.logo,
        };
        subBridges.push(subBridge);
        subBridgesById[id] = subBridge;
      } else {
        subBridgesById[id].tvl += link.flow;
      }
    });
    return { bridges, subBridges };
  }, [convertedData, data]);

  useEffect(() => {
    const findMaxElements = () => {
      const isLandscape = needsLandscape();
      if (!isLandscape) {
        return DEFAULT_MAX_ELEMENTS;
      }
      const freeSpace = (innerHeight - 32 - 32 * 3) / 2 - 24 - 32 - 16 - 51;
      const maxElements = Math.floor(freeSpace / 60);
      setDisplayLimit(maxElements);
      return maxElements;
    };
    findMaxElements();
    window.addEventListener('resize', findMaxElements);
    return () => window.removeEventListener('resize', findMaxElements);
  }, [setDisplayLimit]);
  return (
    <Motion>
      <SocialTags title="Bridges" />
      <menu className={styles.menu}>
        <BridgeTable
          title="Top Bridges"
          tableContent={bridges}
          limit={displayLimit}
        />
        <BridgeTable
          title="Top sub bridges"
          tableContent={subBridges}
          limit={displayLimit}
        />
      </menu>
    </Motion>
  );
};

export const getStaticProps = async () => {
  const data = await loadData();
  const date = new Date().toString();
  return { props: { data, date }, revalidate: 5 * 60 };
};

export default Bridges;
