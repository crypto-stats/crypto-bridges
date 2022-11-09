import { usePlausible } from 'next-plausible';
import { ReactElement, useMemo } from 'react';
import { ISecurityData, Trust } from '../data/security-data';
import { IData } from '../data/types';
import styles from '../styles/Chain.module.css';
import { format } from '../utils';
import BountyBox from './BountyBox';
import BoxRow, { BoxAlign } from './BoxRow';
import DataBox from './DataBox';
import SocialTags from './SocialTags';

interface IBridgeProps {
  data: IData;
  id: string;
  securityData: ISecurityData | null;
}

const trustToColor = (trust: Trust) => {
  switch (trust) {
    case 'Very High':
    case 'High':
      return '#00B73E';
    case 'Medium':
      return '#FF7C04';
    case 'Low':
    case 'Very Low':
    default:
      return '#E20723';
  }
};

const BridgeSpecifics = ({
  data,
  id,
  securityData,
}: IBridgeProps): ReactElement => {
  const plausible = usePlausible();
  const bridge = data.bridges.find((bridge) => bridge.id === id);
  const tvl = useMemo(() => {
    let result = 0;
    data.flows.forEach((flow) => {
      if (flow.bundle === id) {
        result += flow.results.currentValueBridgedAToB ?? 0;
        result += flow.results.currentValueBridgedBToA ?? 0;
      }
    });
    return result;
  }, [data, id]);
  if (bridge === undefined) return <div>Empty!</div>;

  const trackLifiClick = () => void plausible('lifi-click');

  return (
    <div className={styles.nodeSpecifics}>
      <SocialTags
        title={bridge.metadata.name}
        description={bridge.metadata.description || securityData?.Description}
      />

      <div className={styles.nodeItem}>
        <h2>bridge</h2>
        <div className={styles.nodeInfo}>
          <img src={bridge.metadata.icon} width={30} height={30} alt="logo" />
          <p className={styles.nodeName}>{bridge.metadata.name}</p>
        </div>
        <p>{bridge.metadata.description || securityData?.Description}</p>
        <DataBox caption="bridge TVL" value={format(tvl)} />
      </div>

      {securityData && (
        <div className={styles.nodeItem}>
          <h2>
            Trustlessness {}
            <a
              className={styles.byPartner}
              onClick={trackLifiClick}
              target="_blank"
              href="https://li.fi/"
            >
              by LI.FI
            </a>
          </h2>
          <BoxRow
            align={BoxAlign.Left}
            data={[
              {
                caption: 'Score',
                value: (
                  <span className={styles.nodeCategory}>
                    <span
                      className={styles.trustlessnessLight}
                      style={{
                        background: trustToColor(
                          securityData?.Trustlessness ?? '',
                        ),
                      }}
                    ></span>
                    {securityData?.Trustlessness ?? ''}
                  </span>
                ),
              },
              {
                caption: 'Type',
                value: (
                  <span className={styles.nodeCategory}>
                    {securityData?.Category ?? ''}
                  </span>
                ),
              },
            ]}
          />
          <p className={styles.boxCaption}>Security Assumptions</p>
          <div className={styles.securityDataList}>
            {(securityData?.['Security assumptions'] ?? '')
              .split('\n')
              .map((info, index) => (
                <p key={index} className={styles.specialInfo}>
                  {info}
                </p>
              ))}
          </div>
        </div>
      )}

      <BountyBox id={id} securityData={securityData} tvl={tvl} />

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
