import type { NextPage } from 'next';
import Motion from '../../components/Motion';
import { loadData } from '../../data/load-data';
import { IData } from '../../data/types';
import styles from '../../styles/page.module.css';

interface IBridgeProps {
  data: IData;
}

const Bridges: NextPage<IBridgeProps> = ({ data }) => {
  data.bridges[0];
  return (
    <Motion>
      <section className={styles.section}>Todo: Bridges page</section>
    </Motion>
  );
};

export const getStaticProps = async () => {
  const data = await loadData();
  return { props: { data }, revalidate: 5 * 60 };
};

export default Bridges;
