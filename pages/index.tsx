import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import Motion from '../components/Motion';
import { BRIDGED_VALUE_API_URL } from '../constants';
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
      <ul>
        Bridges
        {convertedData.nodes
          .filter((node: any) => node.type === 'bridge')
          .map(({ name }: any, index: number) => (
            <li key={index}>
              <Link href={`bridge/${name}`} scroll={false} passHref={true}>
                <a>{name}</a>
              </Link>
            </li>
          ))}
      </ul>
      <ul>
        Chains
        {convertedData.nodes
          .filter((node: any) => node.type === 'blockchain')
          .map(({ name }: any, index: number) => (
            <li key={index}>
              <Link href={`chain/${name}`} scroll={false} passHref={true}>
                <a>{name}</a>
              </Link>
            </li>
          ))}
      </ul>
    </Motion>
  );
};

export default Home;
