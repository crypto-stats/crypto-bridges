import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { FOOTER_HEIGHT, PANEL_WIDTH } from '../constants';
import styles from '../styles/Footer.module.css';
import { needsLandscape } from '../utils';

export default function Footer() {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const updateToSidePanel = () => {
      const isLandscape = needsLandscape();
      if (el.current !== null) {
        el.current.style.width = `calc(100% - ${
          isLandscape ? PANEL_WIDTH : 0
        }px)`;
      }
    };
    updateToSidePanel();
    window.addEventListener('resize', updateToSidePanel);
    return () => window.removeEventListener('resize', updateToSidePanel);
  }, []);
  return (
    <footer
      ref={el}
      style={{
        height: `${FOOTER_HEIGHT}px`,
      }}
      className={styles.footer}
    >
      <p>
        <a
          href="https://twitter.com/CryptoStats_"
          target="_blank"
          rel="noreferrer"
        >
          <Image src="/twitter.svg" alt="twitter" width="20" height="20" />
        </a>
        <a
          href="https://github.com/crypto-stats/"
          target="_blank"
          rel="noreferrer"
        >
          <Image src="/github.svg" alt="twitter" width="20" height="20" />
        </a>
        <a
          href="https://cryptostats.community/discord"
          target="_blank"
          rel="noreferrer"
        >
          <Image src="/discord.svg" alt="twitter" width="20" height="20" />
        </a>
      </p>
      <p>
        <a href="https://cryptofees.info/">CryptoFees.info</a> |{' '}
        <a href="https://money-movers.info/">MoneyMovers.info</a> |{' '}
        <a href="https://openorgs.info/">OpenOrgs.info</a> |{' '}
        <a href="https://l2fees.info/">L2Fees.info</a> |{' '}
        <a href="https://stakers.info/">Stakers.info</a> |{' '}
        <a href="https://moneyprinter.info/">MoneyPrinter.info</a>
      </p>
    </footer>
  );
}
