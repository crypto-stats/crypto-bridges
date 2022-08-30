import type { NextPage } from 'next';
import { useMemo } from 'react';
import BackButton from '../../components/BackButton';
import Motion from '../../components/Motion';
// import Table from '../../components/Table';
import { loadData } from '../../data/load-data';
import { GetStaticBridgeProps, IDummyData } from '../../data/types';
import styles from '../../styles/page.module.css';
import { convertDummyDataForGraph, IFlowBridgesGraphData } from '../../utils';

interface IBridgeProps {
  bridge: string;
  data: IDummyData;
}

interface IBridgePath {
  params: { bridge: string };
}

const Bridge: NextPage<IBridgeProps> = ({ bridge, data }: IBridgeProps) => {
  const convertedData = useMemo(() => convertDummyDataForGraph(data), [data]);
  const bridgeName = bridge.split('-').join(' ');
  const bridgeData = convertedData.links.find((link) => link.bridge === bridgeName);
  if (bridgeData === undefined) {
    return <p>Empty!</p>;
  }
  return (
    <Motion>
      <section className={styles.section}>
        <BackButton />
        {/* <BridgeSpecifics data={bridgeData} name={bridge} />
        <Table
          listsChains={true}
          title={'connected chains'}
          tableContent={convertedData.nodes
            .filter((node) => {
              for (const link of convertedData.links) {
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
        /> */}
      </section>
    </Motion>
  );
};

export async function getStaticPaths(): Promise<{
  fallback: boolean;
  paths: IBridgePath[];
}> {
  const data = await loadData();
  const convertedData: IFlowBridgesGraphData = convertDummyDataForGraph(data);

  const paths = convertedData.nodes.map(({ chain }): IBridgePath => {
    return { params: { bridge: chain.split(' ').join('-') } };
  });
  return { paths, fallback: false };
}

export const getStaticProps: GetStaticBridgeProps = async ({ params }) => {
  const data = await loadData();

  return { props: { data, ...params }, revalidate: 5 * 60 };
};

export default Bridge;
