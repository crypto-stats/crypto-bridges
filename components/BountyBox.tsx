
import { ISecurityData } from '../data/security-data';
import styles from '../styles/BountyBox.module.css';
import BoxRow, { BoxAlign } from './BoxRow';
import { format } from '../utils';
import { usePlausible } from 'next-plausible';

interface BountyBoxProps {
  id: string;
  securityData: ISecurityData | null;
}

const IMMUNEFI_LANDING_PAGE = 'https://immunefi.webflow.com/';

export default function BountyBox({ id, securityData }: BountyBoxProps) {
  const plausible = usePlausible();

  const trackBountyClick = () => {
    plausible('bounty-click', {
      props: {
        id,
      },
    })
  }

  return (
    <div className={styles.nodeItem}>
      <h2>
        Bug bounties <a href={IMMUNEFI_LANDING_PAGE} className={styles.byPartner}>by immunefi.com</a>
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
          <a
            href={securityData['Bounty link']}
            className={styles.bugButton}
            onClick={trackBountyClick}
            target="_blank"
          >
            View bounty details
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
