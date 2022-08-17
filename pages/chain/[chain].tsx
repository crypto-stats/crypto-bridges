import type { NextPage } from 'next';
import BackButton from '../../components/BackButton';
import BoxRow, { BoxAlign } from '../../components/BoxRow';
import ChainSpecifics from '../../components/Chain';
import Motion from '../../components/Motion';
import Table from '../../components/Table';
import { BRIDGED_VALUE_API_URL } from '../../constants';
import styles from '../../styles/page.module.css';
import type { IGraphData } from '../../utils';
import { convertDataForGraph } from '../../utils';

interface IChainProps {
  chain: string;
  data: IGraphData;
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
        <ChainSpecifics data={data} name={chain} />
        <Table
          listsChains={false}
          title={'connected bridges'}
          tableContent={data.nodes
            .filter((node) => {
              for (const link of data.links) {
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
  const data: IGraphData = await fetch(BRIDGED_VALUE_API_URL)
    .then((r) => r.json())
    .then(convertDataForGraph);
  const paths = data.nodes
    .filter((node) => node.type === 'blockchain')
    .map(({ name }) => {
      return { params: { chain: name.split(' ').join('-') } };
    });
  return { paths, fallback: false };
}

export async function getStaticProps({
  params,
}: IChainPath): Promise<{ props: IChainProps }> {
  const data: IGraphData = await fetch(BRIDGED_VALUE_API_URL)
    .then((r) => r.json())
    .then(convertDataForGraph);
  return {
    props: { ...params, data },
  };
}

export default Chain;
