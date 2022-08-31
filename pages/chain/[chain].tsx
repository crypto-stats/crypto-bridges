import type { NextPage } from 'next';
import BackButton from '../../components/BackButton';
import Motion from '../../components/Motion';
// import Table from '../../components/Table';
import { useMemo } from 'react';
import ChainSpecifics from '../../components/Chain';
import { loadData } from '../../data/load-data';
import { GetStaticBridgeProps, IDummyData } from '../../data/types';
import styles from '../../styles/page.module.css';
import { convertDummyDataForGraph } from '../../utils';

interface IChainProps {
  chain: string;
  data: IDummyData;
}

interface IChainPath {
  params: { chain: string };
}

const Chain: NextPage<IChainProps> = ({ data, chain }: IChainProps) => {
  const convertedData = useMemo(() => convertDummyDataForGraph(data), [data]);
  const chainName = chain.split('-').join(' ');
  return (
    <Motion>
      <section className={styles.section}>
        <BackButton />
        <ChainSpecifics data={data} name={chain} />
      </section>
    </Motion>
  );
};

export async function getStaticPaths(): Promise<{
  fallback: boolean;
  paths: IChainPath[];
}> {
  const data = await loadData();
  const paths = data.chains.map(({ name }) => {
    return { params: { chain: name.split(' ').join('-').toLowerCase() } };
  });
  return { paths, fallback: false };
}

export const getStaticProps: GetStaticBridgeProps = async ({ params }) => {
  const data = await loadData();

  return { props: { data, ...params }, revalidate: 5 * 60 };
};

export default Chain;
