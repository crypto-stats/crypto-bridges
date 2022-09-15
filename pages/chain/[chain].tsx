import type { NextPage } from 'next';
import BackButton from '../../components/BackButton';
import ChainSpecifics from '../../components/Chain';
import Motion from '../../components/Motion';
import { loadData } from '../../data/load-data';
import { GetStaticBridgeProps, IData } from '../../data/types';
import styles from '../../styles/page.module.css';

interface IChainProps {
  chain: string;
  data: IData;
}

interface IChainPath {
  params: { chain: string };
}

const Chain: NextPage<IChainProps> = ({ data, chain }: IChainProps) => {
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
  const paths = data.chains.map(({ id }) => ({ params: { chain: id } }));
  return { paths, fallback: false };
}

export const getStaticProps: GetStaticBridgeProps = async ({ params }) => {
  const data = await loadData();

  return { props: { data, ...params }, revalidate: 5 * 60 };
};

export default Chain;
