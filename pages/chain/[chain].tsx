import type { NextPage } from 'next';
import BackButton from '../../components/BackButton';
import Chain from '../../components/Chain';
import Motion from '../../components/Motion';
import { loadData } from '../../data/load-data';
import { GetStaticBridgeProps, IData } from '../../data/types';
import styles from '../../styles/page.module.css';

interface IChainPageProps {
  chain: string;
  data: IData;
}

interface IChainPagePath {
  params: { chain: string };
}

const ChainPage: NextPage<IChainPageProps> = ({
  data,
  chain,
}: IChainPageProps) => {
  return (
    <Motion>
      <section className={styles.section}>
        <BackButton />
        <Chain data={data} chainId={chain} />
      </section>
    </Motion>
  );
};

export async function getStaticPaths(): Promise<{
  fallback: boolean;
  paths: IChainPagePath[];
}> {
  const data = await loadData();
  const paths = data.chains.map(({ id }) => ({ params: { chain: id } }));
  return { paths, fallback: false };
}

export const getStaticProps: GetStaticBridgeProps = async ({ params }) => {
  const data = await loadData();

  return { props: { data, ...params }, revalidate: 5 * 60 };
};

export default ChainPage;
