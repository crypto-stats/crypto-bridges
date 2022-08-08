import type { NextPage } from 'next';
import { loadData } from '../../utils';

interface IBridgeProps {
  bridge: string;
  tvl: number;
}

interface IBridgePath {
  params: { bridge: string };
}

const Bridge: NextPage<IBridgeProps> = ({ bridge, tvl }: IBridgeProps) => {
  return (
    <div>
      {bridge} : {tvl}
    </div>
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
