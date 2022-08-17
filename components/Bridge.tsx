import Image from 'next/image';
import type { ReactElement } from 'react';
import styles from '../styles/NodeSpecifics.module.css';
import { IGraphData } from '../utils';

interface IBridgeProps {
  data: IGraphData;
  name: string;
}

const BridgeSpecifics = ({ data, name }: IBridgeProps): ReactElement => {
  const bridgeName = name.split('-').join(' ');
  const node = data.nodes.find((node) => node.name === bridgeName);
  if (node === undefined) return <div>Empty!</div>;
  return (
    <div className={styles.nodeSpecifics}>
      <div className={styles.nodeItem}>
        <h2>bridge</h2>
      </div>
      <div className={styles.nodeItem}>
        <div className={styles.nodeInfo}>
          <Image src={node.imageSrc} width={30} height={30} alt="logo" />
          <p className={styles.nodeName}>{bridgeName}</p>
          <p className={styles.nodeCategory}>{node.category}</p>
        </div>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      </div>
      {node.audits && (
        <div className={styles.nodeItem}>
          <div className={styles.nodeDataItem}>
            <h2>security audits</h2>
            <div className={styles.nodeAudits}>
              {node.audits.map((audit, index) => (
                <a
                  key={index}
                  href={audit.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <div className={styles.nodeAudit}>
                    <p className={styles.auditYear}>{audit.date}</p>
                    <p className={styles.auditFirm}>
                      {audit.name.split('by ')[1]}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BridgeSpecifics;
