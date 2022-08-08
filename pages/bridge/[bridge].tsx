import { BRIDGES } from '../../data';

interface IBridgeProps {
  bridge: string;
}

export default function Bridge({ bridge }: IBridgeProps) {
  return <div>{bridge}</div>;
}

export async function getStaticPaths() {
  const paths = BRIDGES.map(({ name }) => {
    return { params: { bridge: name } };
  });
  return { paths, fallback: false };
}

export async function getStaticProps({ params }: { params: IBridgeProps }) {
  return {
    props: { bridge: params.bridge },
  };
}
