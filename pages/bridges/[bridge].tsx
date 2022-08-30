import type { NextPage } from 'next';
import BackButton from '../../components/BackButton';
import BridgeSpecifics from '../../components/Bridge';
import Motion from '../../components/Motion';
import Table from '../../components/Table';
import { BRIDGED_VALUE_API_URL } from '../../constants';
import styles from '../../styles/page.module.css';
import type { IGraphData } from '../../utils';
import { convertDataForGraph } from '../../utils';

interface IBridgeProps {
  bridge: string;
  data: IGraphData;
}

interface IBridgePath {
  params: { bridge: string };
}

const Bridge: NextPage<IBridgeProps> = ({ bridge, data }: IBridgeProps) => {
  const bridgeName = bridge.split('-').join(' ');
  return (
    <Motion>
      <section className={styles.section}>
        <BackButton />
        <BridgeSpecifics data={data} name={bridge} />
        <Table
          listsChains={true}
          title={'connected chains'}
          tableContent={data.nodes
            .filter((node) => {
              for (const link of data.links) {
                if (
                  (link.target === bridgeName && link.source === node.name) ||
                  (link.source === bridgeName && link.target === node.name)
                ) {
                  return node.type === 'blockchain';
                }
              }
              return false;
            })
            .map((node) => ({
              name: node.name,
              logo: node.imageSrc,
              bridgedIn: node.value,
              bridgedOut: node.value,
            }))}
        />
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
      return { params: { bridge: name.split(' ').join('-') } };
    });
  return { paths, fallback: false };
}

export async function getStaticProps({
  params,
}: IBridgePath): Promise<{ props: IBridgeProps }> {
  const data: IGraphData = await fetch(BRIDGED_VALUE_API_URL)
    .then((r) => r.json())
    .then(convertDataForGraph);
  return {
    props: { ...params, data },
  };
}

export default Bridge;
