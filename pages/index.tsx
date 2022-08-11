import type { NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import Motion from '../components/Motion';
import { BRIDGED_VALUE_API_URL } from '../constants';
import styles from '../styles/index.module.css';
import { addLeadingZero, convertDataForGraph } from '../utils';

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
        <ol className={styles.list}>
          Bridges (
          {convertedData.nodes.filter((node) => node.type === 'bridge').length})
          <li className={styles.item}>
            <div className={styles.head}>
              <p>## name</p>
              <p>value</p>
            </div>
          </li>
          {convertedData.nodes
            .filter((node) => node.type === 'bridge')
            .sort((a, b) => b.value - a.value)
            .map(({ name, value, imageSrc }, index: number) => (
              <li key={index} className={styles.item}>
                <Link href={`bridge/${name}`} scroll={false} passHref={true}>
                  <a>
                    <div>
                      <p>{addLeadingZero(index + 1)}</p>
                      <Image
                        src={imageSrc}
                        width="20"
                        height="20"
                        alt=""
                      />{' '}
                      <p>{name}</p>
                    </div>
                    <p>{value}</p>
                  </a>
                </Link>
              </li>
            ))}
        </ol>
        <ol className={styles.list}>
          Chains (
          {
            convertedData.nodes.filter((node) => node.type === 'blockchain')
              .length
          }
          )
          <li className={styles.item}>
            <div className={styles.head}>
              <p>## name</p>
              <p>value</p>
            </div>
          </li>
          {convertedData.nodes
            .filter((node) => node.type === 'blockchain')
            .sort((a, b) => b.value - a.value)
            .map(({ name, value, imageSrc }, index: number) => (
              <li key={index} className={styles.item}>
                <Link href={`chain/${name}`} scroll={false} passHref={true}>
                  <a>
                    <div>
                      <p>{addLeadingZero(index + 1)}</p>
                      <Image src={imageSrc} width="20" height="20" alt="" />
                      <p>{name}</p>
                    </div>
                    <p>{value}</p>
                  </a>
                </Link>
              </li>
            ))}
        </ol>
      </menu>
    </Motion>
  );
};

export default Home;
