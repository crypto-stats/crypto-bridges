import type { NextPage } from 'next';
import Motion from '../components/Motion';
import Table from '../components/Table';
import { loadData } from '../data/load-data';
import { GetStaticBridgeProps, IDummyData } from '../data/types';
import styles from '../styles/index.module.css';
import { convertDummyDataForGraph } from '../utils';

interface HomePageProps {
  data: IDummyData;
}

const Home: NextPage<HomePageProps> = ({ data }) => {
  const convertedData = convertDummyDataForGraph(data);
  return (
    <Motion>
      <menu className={styles.menu}>
        <Table
          listsChains={true}
          title="Top Exporters"
          tableContent={convertedData.nodes.map((node) => ({
            id: node.id,
            name: node.name,
            logo: node.logo,
            tvl: node.tvl,
            in: node.in,
            bridgedIn: 0,
            bridgedOut: 0,
          }))}
        />
        <Table
          listsChains={true}
          title="Top Importers"
          valueIn
          tableContent={convertedData.nodes.map((node) => ({
            id: node.id,
            name: node.name,
            logo: node.logo,
            tvl: node.tvl,
            in: node.in,
            bridgedIn: 0,
            bridgedOut: 0,
          }))}
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
