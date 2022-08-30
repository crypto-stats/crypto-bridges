import Image from 'next/image';
import type { ReactElement } from 'react';
import styles from '../styles/NodeSpecifics.module.css';
import { IFlowBridgesGraphData } from '../utils';
import BoxRow, { BoxAlign } from './BoxRow';

interface IBridgeProps {
  data: IFlowBridgesGraphData;
  name: string;
}

const ChainSpecifics = ({ data, name }: IBridgeProps): ReactElement => {
  const chainName = name.split('-').join(' ');
  const node = data.nodes.find((node) => node.chain === chainName);
  if (node === undefined) return <div>Empty!</div>;
  return (
    <div className={styles.nodeSpecifics}>
      <div className={styles.nodeItem}>
        <h2>chain</h2>
      </div>
      <div className={styles.nodeItem}>
        <div className={styles.nodeInfo}>
          <Image src={node.logo} width={30} height={30} alt="logo" />
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
            { caption: 'Bridge TVL', value: '$ 500mln' },
            { caption: 'Bridge TVL', value: '$ 500mln' },
          ]}
          align={BoxAlign.Left}
        />
      </div>
    </div>
  );
};

export default ChainSpecifics;
