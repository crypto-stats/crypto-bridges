import type { NextPage } from 'next';
import useSWR from 'swr';
import Motion from '../components/Motion';
import Table from '../components/Table';
import { BRIDGED_VALUE_API_URL } from '../constants';
import styles from '../styles/index.module.css';
import type { ICsApiData } from '../utils';
import { convertDataForGraph } from '../utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Home: NextPage = () => {
  const answer = useSWR(BRIDGED_VALUE_API_URL, fetcher);
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
  const convertedData = convertDataForGraph(answer.data as ICsApiData);
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
