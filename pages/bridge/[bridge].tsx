import type { GetStaticProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import BackButton from '../../components/BackButton';
import BridgeSpecifics from '../../components/Bridge';
import Layout from '../../components/Layout';
import Motion from '../../components/Motion';
import Table from '../../components/Table';
import styles from '../../styles/page.module.css';
import { getSDK, INode } from '../../utils';
import { convertDataForGraph } from '../../utils';

interface IBridgeProps {
  bridge: string;
  data: INode[];
}

interface IBridgePath {
  params: { bridge: string };
}

const Bridge: NextPage<IBridgeProps> = ({ bridge, data }: IBridgeProps) => {
  const bridgeName = bridge.split('-').join(' ');

  const tableData = convertDataForGraph(data);

  return (
    <Motion>
      <section className={styles.section}>
        <BackButton />
        <BridgeSpecifics data={tableData} name={bridge} />
        <Table
          listsChains={true}
          title={'connected chains'}
          tableContent={tableData.nodes
            .filter((node) => {
              for (const link of tableData.links) {
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
    </Layout>
  );
};

export async function getStaticPaths(): Promise<{
  fallback: boolean;
  paths: IBridgePath[];
}> {
  const sdk = getSDK();
  const collection = sdk.getCollection('bridged-value');
  await collection.fetchAdapters();

  const data = await collection.executeQueriesWithMetadata(['currentValueLocked']) as INode[];

  const paths = convertDataForGraph(data).nodes
    .filter((node) => node.type === 'bridge')
    .map(({ name }): IBridgePath => {
      return { params: { bridge: name.split(' ').join('-') } };
    });
  return { paths, fallback: false };
}

export const getStaticProps: GetStaticProps<IBridgeProps> = async ({ params }) => {
  const sdk = getSDK();
  const collection = sdk.getCollection('bridged-value');
  await collection.fetchAdapters();

  const data = await collection.executeQueriesWithMetadata(['currentValueLocked']) as INode[];
  return {
    props: {
      bridge: params!.bridge as string,
      data,
    },
  };
}

export default Bridge;
