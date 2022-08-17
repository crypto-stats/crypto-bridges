import Image from 'next/image';
import type { ReactElement } from 'react';
import styles from '../styles/NodeSpecifics.module.css';
import { IGraphData } from '../utils';

interface IBridgeProps {
  data: IGraphData;
  name: string;
}

const ChainSpecifics = ({ data, name }: IBridgeProps): ReactElement => {
  const chainName = name.split('-').join(' ');
  const node = data.nodes.find((node) => node.name === chainName);
  if (node === undefined) return <div>Empty!</div>;
  return (
    <div className={styles.nodeSpecifics}>
      <div className={styles.nodeItem}>
        <h2>chain</h2>
      </div>
      <div className={styles.nodeItem}>
        <div className={styles.nodeInfo}>
          <Image src={node.imageSrc} width={30} height={30} alt="logo" />
          <p className={styles.nodeName}>{chainName}</p>
        </div>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      </div>
    </div>
  );
};

export default ChainSpecifics;
