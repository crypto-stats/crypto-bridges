import type { GetStaticProps, NextPage } from 'next';
import Motion from '../components/Motion';
import Table from '../components/Table';
import styles from '../styles/index.module.css';
import { getSDK, INode } from '../utils';
import { convertDataForGraph } from '../utils';
import Layout from '../components/Layout';

interface HomeProps {
  data: INode[];
}

const Home: NextPage<HomeProps> = ({ data }) => {
  const convertedData = convertDataForGraph(data);

  return (
    <Layout data={data}>
      <Motion key={'main'}>
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
    </Layout>
  );
};

export default Home;

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const sdk = getSDK();
  const collection = sdk.getCollection('bridged-value');
  await collection.fetchAdapters();

  const data = await collection.executeQueriesWithMetadata(['currentValueLocked']) as INode[];

  return { props: { data }, revalidate: 5 * 60 };
};
