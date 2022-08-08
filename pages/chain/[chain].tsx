import { CHAINS } from '../../data';

interface IChainProps {
  chain: string;
}

export default function Chain({ chain }: IChainProps) {
  return <div>{chain}</div>;
}

export async function getStaticPaths() {
  const paths = CHAINS.map(({ name }) => {
    return { params: { chain: name } };
  });
  return { paths, fallback: false };
}

export async function getStaticProps({ params }: { params: IChainProps }) {
  return {
    props: { chain: params.chain },
  };
}
