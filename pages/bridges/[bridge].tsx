import type { NextPage } from 'next';
import BackButton from '../../components/BackButton';
import BridgeSpecifics from '../../components/Bridge';
import Motion from '../../components/Motion';
import Table from '../../components/Table';
import { loadData } from '../../data/load-data';
import { GetStaticBridgeProps, IDummyData } from '../../data/types';
import styles from '../../styles/page.module.css';

interface IBridgeProps {
  bridge: string;
  data: IDummyData;
}

interface IBridgePath {
  params: { bridge: string };
}

const Bridge: NextPage<IBridgeProps> = ({ bridge, data }: IBridgeProps) => {
  return (
    <Motion>
      <section className={styles.section}>
        <BackButton />
        <BridgeSpecifics data={data} id={bridge} />
        <Table
          listsChains={true}
          title={'connected chains'}
          tableContent={data.chains
            .filter((chain) => {
              for (const flow of data.flows) {
                if (
                  flow.bundle === bridge &&
                  (flow.metadata.chainA === chain.name || flow.metadata.chainB === chain.name)
                ) {
                  return true;
                }
              }
              return false;
            })
            .map((chain) => {
              let flowIn = 0;
              let flowOut = 0;
              for (const flow of data.flows) {
                if (flow.metadata.chainA === chain.name) {
                  flowIn += flow.results.currentValueBridgedBToA || 0;
                  flowOut += flow.results.currentValueBridgedAToB || 0;
                } else if (flow.metadata.chainB === chain.name) {
                  flowIn += flow.results.currentValueBridgedAToB || 0;
                  flowOut += flow.results.currentValueBridgedBToA || 0;
                }
              }
              return {
                name: chain.name,
                logo: chain.logo,
                in: flowIn,
                tvl: flowOut,
              };
            })}
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
  const paths = data.bridges.map((bridge): IBridgePath => {
    return { params: { bridge: bridge.id } };
  });
  return { paths, fallback: false };
}

export const getStaticProps: GetStaticBridgeProps = async ({ params }) => {
  const data = await loadData();

  return { props: { data, ...params }, revalidate: 5 * 60 };
};

export default Bridge;
