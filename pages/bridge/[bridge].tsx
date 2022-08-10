import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import Motion from '../../components/Motion';
import { BRIDGED_VALUE_API_URL } from '../../constants';
import { convertDataForGraph, IGraphData } from '../../utils';

interface IBridgeProps {
  bridge: string;
  value?: number;
}

interface IBridgePath {
  params: { bridge: string };
}

const Bridge: NextPage<IBridgeProps> = ({ bridge, value }: IBridgeProps) => {
  const router = useRouter();
  return (
    <Motion key={router.asPath}>
      <section>
        <p>
          This is the page about the {bridge} bridge, with a tvl of {value}.
        </p>
        <p>More details soon.</p>
      </section>
    </Motion>
  );
};

export async function getStaticPaths(): Promise<{
  fallback: boolean;
  paths: IBridgePath[];
}> {
  const data: IGraphData = await fetch(BRIDGED_VALUE_API_URL)
    .then((r) => r.json())
    .then(convertDataForGraph);
  const paths = data.nodes
    .filter((node) => node.type === 'bridge')
    .map(({ name }): IBridgePath => {
      return { params: { bridge: name } };
    });
  return { paths, fallback: false };
}

export async function getStaticProps({
  params,
}: IBridgePath): Promise<{ props: IBridgeProps }> {
  const data: IGraphData = await fetch(BRIDGED_VALUE_API_URL)
    .then((r) => r.json())
    .then(convertDataForGraph);
  const value = data.nodes
    .filter((node) => node.type === 'bridge')
    .find((bridge) => bridge.name === params.bridge)?.value;
  return {
    props: { ...params, value },
  };
}

export default Bridge;
