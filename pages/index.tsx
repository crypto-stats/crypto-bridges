import type { NextPage } from 'next';
import useSWR from 'swr';
import Motion from '../components/Motion';
import Table from '../components/Table';
import styles from '../styles/index.module.css';
import { convertDummyDataForGraph, IDummyData } from '../utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Home: NextPage = () => {
  const answer = useSWR('/dummy.json', fetcher);
  if (answer.error)
    return (
      <div>
        <p className={styles.status}>Fail</p>
      </div>
    );
  if (!answer.data)
    return (
      <div>
        <p className={styles.status}>Loading...</p>
      </div>
    );
  const convertedData = convertDummyDataForGraph(answer.data as IDummyData);
  return (
    <Motion>
      <menu className={styles.menu}>
        <Table
          listsChains={true}
          title={'exporters'}
          tableContent={convertedData.nodes.map((node) => ({
            name: node.chain,
            logo: node.logo,
            tvl: node.tvl,
            in: node.in,
          }))}
        />
        <Table
          valueIn
          listsChains={true}
          title={'importers'}
          tableContent={convertedData.nodes.map((node) => ({
            name: node.chain,
            logo: node.logo,
            tvl: node.tvl,
            in: node.in,
          }))}
        />
      </menu>
    </Motion>
  );
};

export default Home;
