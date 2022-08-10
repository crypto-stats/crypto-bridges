import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import Motion from '../../components/Motion';
import { loadData } from '../../utils';

interface IBridgeProps {
  bridge: string;
  tvl: number;
}

interface IBridgePath {
  params: { bridge: string };
}

const Bridge: NextPage<IBridgeProps> = ({ bridge, tvl }: IBridgeProps) => {
  const router = useRouter();
  return (
    <Motion key={router.asPath}>
      {bridge}: This bridge is worth {tvl} trillions!
    </Motion>
  );
};

export async function getStaticPaths(): Promise<{
  fallback: boolean;
  paths: IBridgePath[];
}> {
  const data = loadData();
  const paths = data.nodes
    .filter((node: any) => node.type === 'bridge')
    .map(({ name }: any): IBridgePath => {
      return { params: { bridge: name } };
    });
  return { paths, fallback: false };
}

export async function getStaticProps({
  params,
}: IBridgePath): Promise<{ props: IBridgeProps }> {
  const data = loadData();
  const tvl = data.nodes
    .filter((node: any) => node.type === 'bridge')
    .find((bridge: any) => bridge.name === params.bridge)!.tvl;
  return {
    props: { ...params, tvl },
  };
}

export default Bridge;
