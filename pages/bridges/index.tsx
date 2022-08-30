import type { NextPage } from 'next';
import BackButton from '../../components/BackButton';
import Motion from '../../components/Motion';
import styles from '../../styles/page.module.css';

const Bridges: NextPage = () => {
  return (
    <Motion>
      <section className={styles.section}>
        <BackButton />
      </section>
    </Motion>
  );
};

export default Bridges;
