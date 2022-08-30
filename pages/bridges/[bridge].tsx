import type { NextPage } from 'next';
import BackButton from '../../components/BackButton';
import Motion from '../../components/Motion';
import styles from '../../styles/page.module.css';
import {
  convertDummyDataForGraph,
  IDummyData,
  IFlowBridgesGraphData,
} from '../../utils';

interface IBridgeProps {
  bridge: string;
  data: IFlowBridgesGraphData;
}

interface IBridgePath {
  params: { bridge: string };
}

const Bridge: NextPage<IBridgeProps> = ({ bridge, data }: IBridgeProps) => {
  const bridgeName = bridge.split('-').join(' ');
  const bridgeData = data.links.find((link) => link.bridge === bridgeName);
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
        /> */}
      </section>
    </Motion>
  );
};

import fsPromises from 'fs/promises';
import path from 'path';
export async function getStaticPaths(): Promise<{
  fallback: boolean;
  paths: IBridgePath[];
}> {
  const filePath = path.join(process.cwd(), 'public/dummy.json');
  const jsonData = (await fsPromises.readFile(filePath)) as any as string;
  const data: IFlowBridgesGraphData = convertDummyDataForGraph(
    JSON.parse(jsonData) as IDummyData,
  );
  const paths = data.nodes.map(({ chain }): IBridgePath => {
    return { params: { bridge: chain.split(' ').join('-') } };
  });
  return { paths, fallback: false };
}

export async function getStaticProps({
  params,
}: IBridgePath): Promise<{ props: IBridgeProps }> {
  const filePath = path.join(process.cwd(), 'public/dummy.json');
  const jsonData = (await fsPromises.readFile(filePath)) as any as string;
  const data: IFlowBridgesGraphData = convertDummyDataForGraph(
    JSON.parse(jsonData) as IDummyData,
  );
  return {
    props: { ...params, data },
  };
}

export default Bridge;
