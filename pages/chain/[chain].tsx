import type { GetStaticProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import BackButton from '../../components/BackButton';
import BoxRow, { BoxAlign } from '../../components/BoxRow';
import ChainSpecifics from '../../components/Chain';
import Layout from '../../components/Layout';
import Motion from '../../components/Motion';
import Table from '../../components/Table';
import styles from '../../styles/page.module.css';
import { getSDK, INode } from '../../utils';
import { convertDataForGraph } from '../../utils';

interface IChainProps {
  chain: string;
  data: INode[];
}

interface IChainPath {
  params: { chain: string };
}

const Chain: NextPage<IChainProps> = ({ chain, data }: IChainProps) => {
  const chainName = chain.split('-').join(' ');

  const tableData = convertDataForGraph(data);
  return (
    <Layout data={data}>
      <Motion>
        <section className={styles.section}>
          <BackButton />
          <ChainSpecifics data={tableData} name={chain} />
          <Table
            listsChains={false}
            title={'connected bridges'}
            tableContent={tableData.nodes
              .filter((node) => {
                for (const link of tableData.links) {
                  if (
                    (link.target === chainName && link.source === node.name) ||
                    (link.source === chainName && link.target === node.name)
                  ) {
                    return node.type === 'bridge';
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
    </Layout>
  );
};

export async function getStaticPaths(): Promise<{
  fallback: boolean;
  paths: IChainPath[];
}> {
  const sdk = getSDK();
  const collection = sdk.getCollection('bridged-value');
  await collection.fetchAdapters();

  const data = await collection.executeQueriesWithMetadata(['currentValueLocked']) as INode[];

  const paths = convertDataForGraph(data).nodes
    .filter((node) => node.type === 'blockchain')
    .map(({ name }) => {
      return { params: { chain: name.split(' ').join('-') } };
    });
  return { paths, fallback: false };
}

export const getStaticProps: GetStaticProps<IChainProps> = async ({ params }) => {
  const sdk = getSDK();
  const collection = sdk.getCollection('bridged-value');
  await collection.fetchAdapters();

  const data = await collection.executeQueriesWithMetadata(['currentValueLocked']) as INode[];

  return {
    props: {
      chain: params!.chain as string,
      data,
    },
    revalidate: 5 * 60,
  };
}

export default Chain;
