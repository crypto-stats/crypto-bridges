import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import BackButton from '../../components/BackButton';
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
      <section>
        <BackButton />
        <p>
          This is the page about the {chain} chain, with a tvl of {value}.
        </p>
        <p>More details soon.</p>
      </section>
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
      return { params: { chain: name.split(' ').join('-') } };
    });
  return { paths, fallback: false };
}

export async function getStaticProps({
  params,
}: IChainPath): Promise<{ props: IChainProps }> {
  const data: IGraphData = await fetch(BRIDGED_VALUE_API_URL)
    .then((r) => r.json())
    .then(convertDataForGraph);
  const value = data.nodes
    .filter((node) => node.type === 'blockchain')
    .find((chain) => chain.name === params.chain.split('-').join(' '))?.value;
  return {
    props: { ...params, value },
  };
}

export default Chain;
