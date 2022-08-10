import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import Motion from '../../components/Motion';
import { BRIDGED_VALUE_API_URL } from '../../constants';
import { convertDataForGraph, IGraphData } from '../../utils';

interface IChainProps {
  chain: string;
  value?: number;
}

interface IChainPath {
  params: { chain: string };
}

const Chain: NextPage<IChainProps> = ({ chain, value }: IChainProps) => {
  const router = useRouter();
  return (
    <Motion key={router.asPath}>
      {chain}: A coin worth {value}.
    </Motion>
  );
};

export async function getStaticPaths(): Promise<{
  fallback: boolean;
  paths: IChainPath[];
}> {
  const data: IGraphData = await fetch(BRIDGED_VALUE_API_URL)
    .then((r) => r.json())
    .then(convertDataForGraph);
  const paths = data.nodes
    .filter((node) => node.type === 'blockchain')
    .map(({ name }) => {
      return { params: { chain: name } };
    });
  return { paths, fallback: false };
}

export async function getStaticProps({
  params,
}: IChainPath): Promise<{ props: IChainProps }> {
  const data: IGraphData = await fetch(BRIDGED_VALUE_API_URL)
    .then((r) => r.json())
    .then(convertDataForGraph);
  // Assume not undefined as it's the same file.
  const value = data.nodes
    .filter((node) => node.type === 'blockchain')
    .find((chain) => chain.name === params.chain)!.value;
  return {
    props: { ...params, value },
  };
}

export default Chain;
