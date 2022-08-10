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
      <p>All rights reserved</p>
    </footer>
  );
}
