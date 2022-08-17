import Image from 'next/image';
import type { ReactElement } from 'react';
import styles from '../styles/Bridge.module.css';
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
    <div className={styles.bridgeSpecifics}>
      <div className={styles.bridgeItem}>
        <h2>bridge</h2>
      </div>
      <div className={styles.bridgeItem}>
        <div className={styles.bridgeInfo}>
          <Image src={node.imageSrc} width={30} height={30} alt="logo" />
          <p className={styles.bridgeName}>{bridgeName}</p>
          <p className={styles.bridgeCategory}>{node.category}</p>
        </div>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      </div>
      <div className={styles.bridgeItem}>
        {node.audits && (
          <div className={styles.bridgeDataItem}>
            <h2>security audits</h2>
            <div className={styles.bridgeAudits}>
              {node.audits.map((audit, index) => (
                <div key={index} className={styles.bridgeAudit}>
                  <a href={audit.url}>
                    <p className={styles.auditYear}>{audit.date}</p>
                    <p className={styles.auditFirm}>
                      {audit.name.split('by ')[1]}
                    </p>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BridgeSpecifics;
