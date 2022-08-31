import type { NextPage } from 'next';
import BackButton from '../../components/BackButton';
import Motion from '../../components/Motion';
// import Table from '../../components/Table';
import { loadData } from '../../data/load-data';
import { GetStaticBridgeProps, IDummyData } from '../../data/types';
import styles from '../../styles/page.module.css';
import { convertDummyDataForGraph,  IFlowBridgesGraphData } from '../../utils';

interface IChainProps {
  chain: string;
  data: IDummyData;
}

interface IChainPath {
  params: { chain: string };
}

const Chain: NextPage<IChainProps> = ({ data, chain }: IChainProps) => {
  const convertedData = useMemo(() => convertDummyDataForGraph(data), [data]);
  // const chainName = chain.split('-').join(' ');
  return (
    <Motion>
      <section className={styles.section}>
        <BackButton />
        {/* <ChainSpecifics data={data} name={chain} />
        <Table
          listsChains={false}
          title={'connected bridges'}
          tableContent={data.links
            .filter((link) => {
              for (const link of data.links) {
                if (
                  (link.target === chainName && link.source === node.chain) ||
                  (link.source === chainName && link.target === node.chain)
                ) {
                  return node.type === 'bridge';
                }
              }
              return false;
            })
            .map((node) => ({
              name: node.chain,
              logo: node.logo,
              tvl: node.tvl
            }))}
        >
          <BoxRow
            data={[
              { caption: 'tvl', value: '$ 40bn' },
              { caption: 'bridged out', value: '$ 40bn' },
            ]}
            align={BoxAlign.Center}
          ></BoxRow>
        </Table> */}
      </section>
    </Motion>
  );
};

import fsPromises from 'fs/promises';
import path from 'path';
import { useMemo } from 'react';
export async function getStaticPaths(): Promise<{
  fallback: boolean;
  paths: IChainPath[];
}> {
  const data = await loadData();
  const convertedData = convertDummyDataForGraph(data);

  const paths = convertedData.nodes.map(({ chain }) => {
    return { params: { chain: chain.split(' ').join('-') } };
  });
  return { paths, fallback: false };
}

export const getStaticProps: GetStaticBridgeProps = async ({ params }) => {
  const data = await loadData();

  return { props: { data, ...params }, revalidate: 5 * 60 };
};

export default Chain;
