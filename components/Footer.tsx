import { FOOTER_HEIGHT } from '../constants';
import styles from '../styles/Footer.module.css';

export default function Footer() {
  return (
    <footer
      style={{
        height: `${FOOTER_HEIGHT}px`,
      }}
      className={styles.footer}
    >
      <p>
        <span>
          Powered by <a href="https://cryptostats.community">CryptoStats</a> (
          <a href="https://forum.cryptostats.community/">Forum</a>)
        </span>
        <span>
          <a href="https://twitter.com/CryptoStats_">Twitter</a> |{' '}
          <a href="https://cryptostats.community/discord">Discord</a> |{' '}
          <a href="https://github.com/crypto-stats/">Github</a>
        </span>
      </p>
      <p>
        <span>Check out our websites:</span>
        <span>
          <a href="https://cryptofees.info/">cryptofees.info</a> |{' '}
          <a href="https://money-movers.info/">money-movers.info</a> |{' '}
          <a href="https://openorgs.info/">open-orgs.info</a> |{' '}
          <a href="https://l2fees.info/">l2fees.info</a> |{' '}
          <a href="https://stakers.info/">stakers.info</a> |{' '}
          <a href="https://moneyprinter.info/">moneyprinter.info</a>
        </span>
      </p>
    </footer>
  );
}
