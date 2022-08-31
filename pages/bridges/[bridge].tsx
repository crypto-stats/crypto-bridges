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
  const bridgeName = bridge.split('-').join(' ');
  return (
    <Motion>
      <section className={styles.section}>
        <BackButton />
        <BridgeSpecifics data={data} name={bridge} />
        <Table
          listsChains={true}
          title={'connected chains'}
          tableContent={data.chains
            .filter((chain) => {
              for (const flow of data.flows) {
                if (
                  flow.bridge.toLowerCase() === bridgeName &&
                  (flow.a === chain.name || flow.b === chain.name)
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
                if (flow.a === chain.name) {
                  flowIn += flow.bToA;
                  flowOut += flow.aToB;
                } else if (flow.b === chain.name) {
                  flowIn += flow.aToB;
                  flowOut += flow.bToA;
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
  const paths = data.bridges.map(({ name }): IBridgePath => {
    return { params: { bridge: name.split(' ').join('-').toLowerCase() } };
  });
  return { paths, fallback: false };
}

export const getStaticProps: GetStaticBridgeProps = async ({ params }) => {
  const data = await loadData();

  return { props: { data, ...params }, revalidate: 5 * 60 };
};

export default Bridge;
