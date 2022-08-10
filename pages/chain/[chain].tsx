import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import Motion from '../../components/Motion';
import { loadData } from '../../utils';

interface IChainProps {
  chain: string;
  mc: number;
}

const Chain: NextPage<IChainProps> = ({ chain, mc }: IChainProps) => {
  const router = useRouter();
  return (
    <Motion key={router.asPath}>
      {chain}: A coin worth ${mc}B.
    </Motion>
  );
};

export async function getStaticPaths() {
  const data = loadData();
  const paths = data.nodes
    .filter((node: any) => node.type === 'blockchain')
    .map(({ name }: any) => {
      return { params: { chain: name } };
    });
  return { paths, fallback: false };
}

export async function getStaticProps({ params }: { params: IChainProps }) {
  const data = loadData();
  // Assume not undefined as it's the same file.
  const mc = data.nodes
    .filter((node: any) => node.type === 'blockchain')
    .find((chain: any) => chain.name === params.chain)!.mc;
  return {
    props: { ...params, mc },
  };
}

export default Chain;
