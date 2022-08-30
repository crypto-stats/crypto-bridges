import type { NextPage } from 'next';
import Motion from '../components/Motion';
import Table from '../components/Table';
import { loadData } from '../data/load-data';
import { GetStaticBridgeProps, IDataContext } from '../data/types';
import styles from '../styles/index.module.css';
import { convertDataForGraph } from '../utils';

interface HomePageProps {
  data: IDataContext
}

const Home: NextPage<HomePageProps> = ({ data }) => {
  const convertedData = convertDataForGraph(data.subBridges);
  return (
    <Motion>
      <menu className={styles.menu}>
        <Table
          listsChains={false}
          title={'bridges'}
          tableContent={convertedData.nodes
            .filter((node) => node.type === 'bridge')
            .map((node) => ({
              name: node.name,
              logo: node.imageSrc,
              bridgedIn: node.value,
              bridgedOut: node.value,
            }))}
        />
        <Table
          listsChains={true}
          title={'chains'}
          tableContent={convertedData.nodes
            .filter((node) => node.type === 'blockchain')
            .map((node) => ({
              name: node.name,
              logo: node.imageSrc,
              bridgedIn: node.value,
              bridgedOut: node.value,
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
