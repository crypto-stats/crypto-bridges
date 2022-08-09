import type { NextPage } from 'next';
import Link from 'next/link';
import useSWR from 'swr';
import Motion from '../components/Motion';
const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Home: NextPage = () => {
  const { data, error } = useSWR('/data.json', fetcher);
  if (error) return <p>Fail</p>;
  if (!data) return <p>Loading</p>;
  return (
    <Motion>
      <ul>
        Bridges
        {data.nodes
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
        {data.nodes
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
