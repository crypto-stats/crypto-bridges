import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import Motion from '../components/Motion';
const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Home: NextPage = () => {
  const router = useRouter();
  const { data, error } = useSWR('/data.json', fetcher);
  if (error) return <p>Fail</p>;
  if (!data) return <p>Loading</p>;
  return (
    <Motion key={router.asPath}>
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
