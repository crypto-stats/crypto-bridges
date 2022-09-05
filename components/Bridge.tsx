import Image from 'next/image';
import type { ReactElement } from 'react';
import { IDummyData } from '../data/types';
import styles from '../styles/NodeSpecifics.module.css';
import BoxRow, { BoxAlign } from './BoxRow';

interface IBridgeProps {
  data: IDummyData;
  id: string;
}

const BridgeSpecifics = ({ data, id }: IBridgeProps): ReactElement => {
  const bridge = data.bridges.find((bridge) => bridge.id === id);
  if (bridge === undefined) return <div>Empty!</div>;
  return (
    <div className={styles.nodeSpecifics}>
      <div className={styles.nodeItem}>
        <h2>bridge</h2>
        <div className={styles.nodeInfo}>
          <Image src={bridge.metadata.icon} width={30} height={30} alt="logo" />
          <p className={styles.nodeName}>{bridge.metadata.name}</p>
          <p className={styles.nodeCategory}>{bridge.metadata.category}</p>
        </div>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <BoxRow
          data={[
            { caption: 'Bridge TVL', value: '$ 500mln' },
            { caption: 'Bridge TVL', value: '$ 500mln' },
          ]}
          align={BoxAlign.Left}
        />
      </div>
      <div className={styles.nodeItemGap8}>
        <h2>Trustiness</h2>
        <p className={styles.specialInfo}>
          Trusted systems with no staked collateral
        </p>
      </div>
      <div className={styles.nodeItem}>
        <h2>
          Bug bounties{' '}
          <span className={styles.byImmunefi}>by immunefi.com</span>
        </h2>
        <BoxRow
          data={[
            { caption: 'Live since', value: '11 Feb 2022' },
            { caption: 'KYC required', value: 'yes' },
            { caption: 'max bounty', value: '$10,000,000' },
          ]}
          align={BoxAlign.Center}
        />
        <a
          href="#"
          className={styles.bugButton}
          rel="noreferrer"
          target="_blank"
        >
          Submit bug
        </a>
      </div>
      {bridge.metadata.audits?.length && (
        <div className={styles.nodeItem}>
          <div className={styles.nodeDataItem}>
            <h2>security audits</h2>
            <div className={styles.nodeAudits}>
              {bridge.metadata.audits.map((audit, index) => (
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
