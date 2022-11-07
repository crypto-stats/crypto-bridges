
import { ISecurityData } from '../data/security-data';
import styles from '../styles/BountyBox.module.css';
import BoxRow, { BoxAlign } from './BoxRow';
import { format } from '../utils';

interface BountyBoxProps {
  securityData: ISecurityData | null;
}

export default function BountyBox({ securityData }: BountyBoxProps) {
  return (
    <div className={styles.nodeItem}>
      <h2>
        Bug bounties <span className={styles.byPartner}>by immunefi.com</span>
      </h2>

      {securityData?.['Bounty max'] !== undefined ? (
        <>
          <BoxRow
            data={[
              {
                caption: 'Live since',
                value: securityData['Bounty live since'],
              },
              {
                caption: 'max bounty',
                value: format(Number(securityData['Bounty max'])),
              },
            ]}
            align={BoxAlign.Left}
          />
          <a href={securityData['Bounty link']} className={styles.bugButton} rel="noreferrer" target="_blank">
            Submit bug
          </a>
        </>
      ) : (
        <div className={styles.bounty404}>
          <img
            src="/nobounty.svg"
            alt="No bug bounty"
            width="15"
            height="15"
          />
          <p>This bridge has no bug bounty</p>
        </div>
      )}
    </div>
  )
}
