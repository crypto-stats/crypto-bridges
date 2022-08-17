import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { HEADER_HEIGHT, PANEL_WIDTH } from '../constants';
import styles from '../styles/Header.module.css';
import { needsLandscape } from '../utils';

export default function Header() {
  const router = useRouter();
  const el = useRef<HTMLDivElement>(null);
  if (el.current !== null) {
    el.current.style.height = `${HEADER_HEIGHT}px`;
  }
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
    <header className={styles.header} ref={el}>
      <a onClick={() => router.push('/', undefined, { scroll: false })}>
        <span className={styles.verticalAlign}>
          <Image src="/logo.png" width={45} height={45} alt="" />
        </span>
        <h1>Cryptobridges.info</h1>
      </a>
      <p className={styles.baseline}>
        <span className={styles.poweredBy}>Powered by</span>{' '}
        <a
          href="https://cryptostats.community"
          target="_blank"
          rel="noreferrer"
        >
          <b className={styles.verticalAlign}>
            <span className={styles.verticalAlign}>
              <Image
                src={'/cryptostats.svg'}
                alt="logo"
                width={20}
                height={20}
                className={styles.verticalAlign}
              />
            </span>{' '}
            CryptoStats
          </b>
        </a>
      </p>
    </header>
  );
}
