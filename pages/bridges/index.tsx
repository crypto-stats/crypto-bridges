import type { NextPage } from 'next';
import { useEffect, useMemo, useState } from 'react';
import BridgeTable from '../../components/BridgeTable';
import Motion from '../../components/Motion';
import { loadData } from '../../data/load-data';
import { IData } from '../../data/types';
import styles from '../../styles/index.module.css';
import { convertDataForGraph, IBridgeLink, needsLandscape } from '../../utils';

const DEFAULT_MAX_ELEMENTS = 4;

interface IBridgeProps {
  data: IData;
  date: string;
}

type BridgeList = { id: string; name: string; tvl: number; logo: string }[];
type SubbridgeList = {
  id: string;
  name: string;
  tvl: number;
  logo: string;
  chain1Name: string;
  chain1Logo?: string;
  chain2Name: string;
  chain2Logo?: string;
}[];

const Bridges: NextPage<IBridgeProps> = ({ data, date }) => {
  console.log(`Data for bridge page collected on ${date}`);
  const convertedData = convertDataForGraph(data);
  const [displayLimit, setDisplayLimit] = useState(DEFAULT_MAX_ELEMENTS);
  const { bridges, subbridges } = useMemo(() => {
    const bridges: BridgeList = [];
    const subbridges: SubbridgeList = [];
    convertedData.links.forEach((x) => {
      const link = x as unknown as IBridgeLink;
      if (link.bridge === undefined) return;
      const existingBridgeIndex = bridges.findIndex(
        (bridge) => bridge.name === link.bridge,
      );
      if (existingBridgeIndex === -1) {
        bridges.push({
          name: link.bridge,
          id: link.bridge,
          tvl: link.flow,
          logo: link.logo,
        });
      } else {
        bridges[existingBridgeIndex].tvl += link.flow;
      }
      const existingSubbridgeIndex = subbridges.findIndex(
        (subbridge) =>
          [link.source, link.target].includes(subbridge.chain1Name) &&
          [link.source, link.target].includes(subbridge.chain2Name),
      );
      if (existingSubbridgeIndex === -1) {
        subbridges.push({
          name: link.source + ' - ' + link.target,
          id: link.bridge,
          tvl: link.flow,
          logo: link.logo,
          chain1Name: link.source,
          chain1Logo: data.chains.find((chain) => chain.id === link.source)
            ?.logo,
          chain2Name: link.target,
          chain2Logo: data.chains.find((chain) => chain.id === link.target)
            ?.logo,
        });
      } else {
        subbridges[existingSubbridgeIndex].tvl += link.flow;
      }
    });
    return { bridges, subbridges };
  }, [convertedData, data]);
  bridges.sort((a, b) => b.tvl - a.tvl);
  subbridges.sort((a, b) => b.tvl - a.tvl);
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
      <menu className={styles.menu}>
        <BridgeTable
          title="Top Bridges"
          tableContent={bridges}
          limit={displayLimit}
        />
        <BridgeTable
          title="Top sub bridges"
          tableContent={subbridges}
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
