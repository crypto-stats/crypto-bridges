import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import Motion from '../components/Motion';
import Table from '../components/Table';
import { BRIDGED_VALUE_API_URL } from '../constants';
import styles from '../styles/index.module.css';
import type { ICsApiData } from '../utils';
import { convertDataForGraph } from '../utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Home: NextPage = () => {
  const router = useRouter();
  const answer = useSWR(BRIDGED_VALUE_API_URL, fetcher);
  if (answer.error) return <p>Fail</p>;
  if (!answer.data) return <p>Loading</p>;
  const convertedData = convertDataForGraph(answer.data as ICsApiData);
  return (
    <Motion key={router.asPath}>
      <menu className={styles.menu}>
        <Table
          listsChains={false}
          title={'bridges'}
          tableContent={convertedData.nodes
            .filter((node) => node.type === 'bridge')
            .sort((a, b) => b.value - a.value)
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
            .sort((a, b) => b.value - a.value)
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
