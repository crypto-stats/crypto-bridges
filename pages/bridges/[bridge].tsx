import type { NextPage } from 'next';
import BackButton from '../../components/BackButton';
import BridgeSpecifics from '../../components/Bridge';
import Motion from '../../components/Motion';
import Table from '../../components/Table';
import { loadData } from '../../data/load-data';
import { GetStaticBridgeProps, IDataContext } from '../../data/types';
import styles from '../../styles/page.module.css';
import { convertDataForGraph } from '../../utils';

interface IBridgeProps {
  bridge: string;
  data: IDataContext;
}

interface IBridgePath {
  params: { bridge: string };
}

const Bridge: NextPage<IBridgeProps> = ({ bridge, data }: IBridgeProps) => {
  const bridgeName = bridge.split('-').join(' ');
  const convertedData = convertDataForGraph(data.subBridges);

  return (
    <Motion>
      <section className={styles.section}>
        <BackButton />
        <BridgeSpecifics data={convertedData} name={bridge} />
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
        />
      </section>
    </Motion>
  );
};

export async function getStaticPaths(): Promise<{
  fallback: boolean;
  paths: IBridgePath[];
}> {
  const data = await loadData();
  const convertedData = convertDataForGraph(data.subBridges);

  const paths = convertedData.nodes
    .filter((node) => node.type === 'bridge')
    .map(({ name }): IBridgePath => {
      return { params: { bridge: name.split(' ').join('-') } };
    });
  return { paths, fallback: false };
}

export const getStaticProps: GetStaticBridgeProps = async ({ params }) => {
  const data = await loadData();

  return { props: { data, ...params }, revalidate: 5 * 60 };
};

export default Bridge;
