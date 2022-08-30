import type { NextPage } from 'next';
import BackButton from '../../components/BackButton';
import Motion from '../../components/Motion';
import styles from '../../styles/page.module.css';
import {
  convertDummyDataForGraph,
  IDummyData,
  IFlowBridgesGraphData,
} from '../../utils';

interface IChainProps {
  chain: string;
  data: IFlowBridgesGraphData;
}

interface IChainPath {
  params: { chain: string };
}

const Chain: NextPage<IChainProps> = ({ chain, data }: IChainProps) => {
  const chainName = chain.split('-').join(' ');
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
export async function getStaticPaths(): Promise<{
  fallback: boolean;
  paths: IChainPath[];
}> {
  const filePath = path.join(process.cwd(), 'public/dummy.json');
  const jsonData = (await fsPromises.readFile(filePath)) as any as string;
  const data: IFlowBridgesGraphData = convertDummyDataForGraph(
    JSON.parse(jsonData) as IDummyData,
  );
  const paths = data.nodes.map(({ chain }) => {
    return { params: { chain: chain.split(' ').join('-') } };
  });
  return { paths, fallback: false };
}

export async function getStaticProps({
  params,
}: IChainPath): Promise<{ props: IChainProps }> {
  const filePath = path.join(process.cwd(), 'public/dummy.json');
  const jsonData = (await fsPromises.readFile(filePath)) as any as string;
  const data: IFlowBridgesGraphData = convertDummyDataForGraph(
    JSON.parse(jsonData) as IDummyData,
  );
  return {
    props: { ...params, data },
  };
}

export default Chain;
