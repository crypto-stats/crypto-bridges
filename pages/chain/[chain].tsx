import type { NextPage } from 'next';
import BackButton from '../../components/BackButton';
import BoxRow, { BoxAlign } from '../../components/BoxRow';
import ChainSpecifics from '../../components/Chain';
import Motion from '../../components/Motion';
import Table from '../../components/Table';
import { loadData } from '../../data/load-data';
import { GetStaticBridgeProps, IDataContext } from '../../data/types';
import styles from '../../styles/page.module.css';
import type { IGraphData } from '../../utils';
import { convertDataForGraph } from '../../utils';

interface IChainProps {
  chain: string;
  data: IDataContext;
}

interface IChainPath {
  params: { chain: string };
}

const Chain: NextPage<IChainProps> = ({ data, chain }: IChainProps) => {
  const chainName = chain.split('-').join(' ');
  const convertedData = convertDataForGraph(data.subBridges);
  return (
    <Motion>
      <section className={styles.section}>
        <BackButton />
        <ChainSpecifics data={convertedData} name={chain} />
        <Table
          listsChains={false}
          title={'connected bridges'}
          tableContent={convertedData.nodes
            .filter((node) => {
              for (const link of convertedData.links) {
                if (
                  (link.target === chainName && link.source === node.name) ||
                  (link.source === chainName && link.target === node.name)
                ) {
                  return node.type === 'bridge';
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
        >
          <BoxRow
            data={[
              { caption: 'tvl', value: '$ 40bn' },
              { caption: 'bridged out', value: '$ 40bn' },
            ]}
            align={BoxAlign.Center}
          ></BoxRow>
        </Table>
      </section>
    </Motion>
  );
};

export async function getStaticPaths(): Promise<{
  fallback: boolean;
  paths: IChainPath[];
}> {
  const data = await loadData();
  const convertedData = convertDataForGraph(data.subBridges);

  const paths = convertedData.nodes
    .filter((node) => node.type === 'blockchain')
    .map(({ name }) => {
      return { params: { chain: name.split(' ').join('-') } };
    });
  return { paths, fallback: false };
}

export const getStaticProps: GetStaticBridgeProps = async ({ params }) => {
  const data = await loadData();

  return { props: { data, ...params }, revalidate: 5 * 60 };
};

export default Chain;
