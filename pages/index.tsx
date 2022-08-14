import type { NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import Motion from '../components/Motion';
import { BRIDGED_VALUE_API_URL } from '../constants';
import styles from '../styles/index.module.css';
import type { ICsApiData } from '../utils';
import { addLeadingZero, convertDataForGraph } from '../utils';

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
        <ol className={styles.list}>
          <h2>Bridges</h2>
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
                <Link
                  href={`bridge/${name.split(' ').join('-')}`}
                  scroll={false}
                  passHref={true}
                >
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
                    <p>{value?.toFixed(0)}</p>
                  </a>
                </Link>
              </li>
            ))}
        </ol>
        <ol className={styles.list}>
          <h2>Chains</h2>
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
                <Link
                  href={`chain/${name.split(' ').join('-')}`}
                  scroll={false}
                  passHref={true}
                >
                  <a>
                    <div>
                      <p>{addLeadingZero(index + 1)}</p>
                      <img src={imageSrc} width="20" height="20" alt="" />
                      <p>{name}</p>
                    </div>
                    <p>{value?.toFixed(0)}</p>
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
