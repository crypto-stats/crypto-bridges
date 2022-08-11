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
        <a href="https://cryptofees.info/">cryptofees.info</a> |{' '}
        <a href="https://money-movers.info/">money-movers.info</a> |{' '}
        <a href="https://openorgs.info/">open-orgs.info</a> |{' '}
        <a href="https://l2fees.info/">l2fees.info</a> |{' '}
        <a href="https://stakers.info/">stakers.info</a> |{' '}
        <a href="https://moneyprinter.info/">moneyprinter.info</a>
      </p>
      <p>
        Powered by <a href="https://cryptostats.community">CryptoStats</a>
      </p>
    </footer>
  );
}
