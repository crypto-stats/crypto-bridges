import type { GetStaticProps, NextPage } from 'next';
import BackButton from '../../components/BackButton';
import Chain from '../../components/Chain';
import Motion from '../../components/Motion';
import { loadData } from '../../data/load-data';
import { getSecurityData, ISecurityData } from '../../data/security-data';
import { IData } from '../../data/types';
import styles from '../../styles/page.module.css';

interface IChainPageProps {
  chain: string;
  data: IData;
  securityData: ISecurityData | null;
  date: string;
}

interface IChainPagePath {
  params: { chain: string };
}

const ChainPage: NextPage<IChainPageProps> = ({
  data,
  date,
  chain,
  securityData,
}: IChainPageProps) => {
  console.log(`Data for chain page ${chain} collected on ${date}`);
  return (
    <Motion>
      <section className={styles.section}>
        <BackButton />
        <Chain data={data} chainId={chain} securityData={securityData} />
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

export const getStaticProps: GetStaticProps<IChainPageProps, { chain: string }> = async ({ params }) => {
  const [data, securityData] = await Promise.all([
    loadData(),
    getSecurityData(params!.chain),
  ]);
  const date = new Date().toString();
  return { props: { data, date, securityData, chain: params!.chain }, revalidate: 5 * 60 };
};

export default ChainPage;
