import Image from 'next/image';
import type { ReactElement } from 'react';
import { IDummyData } from '../data/types';
import styles from '../styles/NodeSpecifics.module.css';
import BoxRow, { BoxAlign } from './BoxRow';

interface IBridgeProps {
  data: IDummyData;
  name: string;
}

const ChainSpecifics = ({ data, name }: IBridgeProps): ReactElement => {
  const chainName = name.split('-').join(' ');
  const chain = data.chains.find((chain) => chain.name === chainName);
  if (chain === undefined) return <div>Empty!</div>;
  return (
    <div className={styles.nodeSpecifics}>
      <div className={styles.nodeItem}>
        <h2>chain</h2>
      </div>
      <div className={styles.nodeItem}>
        <div className={styles.nodeInfo}>
          <Image src={chain.logo} width={30} height={30} alt="logo" />
          <p className={styles.nodeName}>{chainName}</p>
        </div>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      </div>
      <div className={styles.nodeItem}>
        <BoxRow
          data={[
            { caption: 'Total TVL', value: '$ 500mln' },
            { caption: 'Total inflow', value: '$ 500mln' },
          ]}
          align={BoxAlign.Left}
        />
      </div>
    </div>
  );
};

export default ChainSpecifics;
