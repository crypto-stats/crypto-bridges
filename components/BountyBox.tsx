
import { ISecurityData } from '../data/security-data';
import styles from '../styles/BountyBox.module.css';
import BoxRow, { BoxAlign } from './BoxRow';
import { format } from '../utils';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { usePlausible } from 'next-plausible';

interface BountyBoxProps {
  id: string;
  securityData: ISecurityData | null;
  tvl: number;
}

const IMMUNEFI_LANDING_PAGE = 'https://immunefi.webflow.io/';

export default function BountyBox({ id, securityData, tvl }: BountyBoxProps) {
  const plausible = usePlausible();

  const utm = `?utm_source=cryptoflows&utm_medium=partner&utm_campaign=2022_Q4_partnership&utm_content=${id}`;
  const immunefiLink = `${IMMUNEFI_LANDING_PAGE}${utm}`;

  const trackBountyClick = () => {
    plausible('bounty-click', {
      props: {
        id,
      },
    })
  };
  const trackImmunefiClick = () => void plausible('immunefi-click');

  return (
    <div className={styles.nodeItem}>
      <h2>
        Bug bounties {}
        <a
          href={immunefiLink}
          className={styles.byPartner}
          target="_blank"
          onClick={trackImmunefiClick}
        >
          by immunefi.com
        </a>
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
                caption: '% of TVL',
                value: (parseFloat(securityData['Bounty max']) / tvl * 100).toFixed(1) + '%',
              },
              {
                caption: 'max bounty',
                value: format(Number(securityData['Bounty max'])),
              },
            ]}
            align={BoxAlign.Left}
          />
          <a
            href={securityData['Bounty link'] + utm}
            onClick={trackBountyClick}
            target="_blank"
            className={styles.immunefiCTA}
          >
            View bounty details
            <ExternalLink className={styles.external} size={16} />
          </a>
        </>
      ) : (
        <div className={styles.bounty404}>
          <p>
            <AlertTriangle className={styles.warn} size={16} />
            This bridge has no bug bounty
          </p>
          <a
            href={immunefiLink}
            target="_blank"
            onClick={trackImmunefiClick}
            className={styles.immunefiCTA}
          >
            Learn how to secure your project
            <ExternalLink className={styles.external} size={16} />
          </a>
        </div>
      )}
    </div>
  )
}
