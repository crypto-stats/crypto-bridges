import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import Motion from '../components/Motion';
import Table from '../components/Table';
import { loadData } from '../data/load-data';
import { GetStaticBridgeProps, IData } from '../data/types';
import styles from '../styles/index.module.css';
import { convertDataForGraph, needsLandscape } from '../utils';

const DEFAULT_MAX_ELEMENTS = 4;

interface HomePageProps {
  data: IData;
}

const Home: NextPage<HomePageProps> = ({ data }) => {
  const convertedData = convertDataForGraph(data);
  const [displayLimit, setDisplayLimit] = useState<number>();
  const exports = convertedData.nodes
    .map((node) => ({
      id: node.id,
      name: node.name,
      logo: node.logo,
      tvl: node.tvl,
      in: node.in,
      bridgedIn: 0,
      bridgedOut: 0,
    }))
    .sort((a, b) => b.tvl - a.tvl);
  const imports = convertedData.nodes
    .map((node) => ({
      id: node.id,
      name: node.name,
      logo: node.logo,
      tvl: node.tvl,
      in: node.in,
      bridgedIn: 0,
      bridgedOut: 0,
    }))
    .sort((a, b) => b.in - a.in);
  useEffect(() => {
    const findMaxElements = () => {
      const isLandscape = needsLandscape();
      if (!isLandscape) {
        return DEFAULT_MAX_ELEMENTS;
      }
      const freeSpace = (innerHeight - 40 - 40 * 3) / 2 - 24 - 40 - 16 - 51;
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
        <Table
          listsChains={true}
          title="Top Exporters"
          tableContent={exports}
          limit={displayLimit}
        />
        <Table
          listsChains={true}
          title="Top Importers"
          valueIn
          tableContent={imports}
          limit={displayLimit}
        />
      </menu>
    </Motion>
  );
};

export default Home;

export const getStaticProps: GetStaticBridgeProps = async () => {
  const data = await loadData();

  return { props: { data }, revalidate: 5 * 60 };
};
