import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import Motion from '../components/Motion';
import { BRIDGED_VALUE_API_URL } from '../constants';
import styles from '../styles/index.module.css';
import { convertDataForGraph } from '../utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Home: NextPage = () => {
  const router = useRouter();
  const { data, error } = useSWR(BRIDGED_VALUE_API_URL, fetcher);
  if (error) return <p>Fail</p>;
  if (!data) return <p>Loading</p>;
  const convertedData = convertDataForGraph(data);
  return (
    <Motion key={router.asPath}>
      <menu className={styles.menu}>
        <ul className={styles.list}>
          Bridges
          {convertedData.nodes
            .filter((node: any) => node.type === 'bridge')
            .map(({ name, value }, index: number) => (
              <li key={index} className={styles.item}>
                <Link href={`bridge/${name}`} scroll={false} passHref={true}>
                  <a>
                    <p>{name}</p>
                    <p>{value}</p>
                  </a>
                </Link>
              </li>
            ))}
        </ul>
        <ul className={styles.list}>
          Chains
          {convertedData.nodes
            .filter((node) => node.type === 'blockchain')
            .map(({ name, value }, index: number) => (
              <li key={index} className={styles.item}>
                <Link href={`chain/${name}`} scroll={false} passHref={true}>
                  <a>
                    <p>{name}</p>
                    <p>{value}</p>
                  </a>
                </Link>
              </li>
            ))}
        </ul>
      </menu>
    </Motion>
  );
};

export default Home;
