import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { HEADER_HEIGHT, PANEL_WIDTH } from '../constants';
import styles from '../styles/Header.module.css';
import { needsLandscape } from '../utils';

export default function Header() {
  const [isHorizontal, setHorizontal] = useState(false);
  const el = useRef<HTMLDivElement>(null);
  if (el.current !== null) {
    el.current.style.height = `${HEADER_HEIGHT}px`;
  }
  useEffect(() => {
    const updateToSidePanel = () => {
      const isLandscape = needsLandscape();
      setHorizontal(isLandscape);
      if (el.current !== null) {
        el.current.style.width = `calc(100% - ${
          isLandscape ? PANEL_WIDTH : 0
        }px)`;
      }
    };
    updateToSidePanel();
    window.addEventListener('resize', updateToSidePanel);
    return () => window.removeEventListener('resize', updateToSidePanel);
  }, [setHorizontal]);
  return (
    <header className={styles.header} ref={el}>
      <div className={isHorizontal ? styles.onelineHorizontal : styles.oneline}>
        <Link href={'/'} passHref={true} scroll={false}>
          <a>
            {/* If logo needed, code below is ready, needs update the h1 margins.
            <span className={styles.verticalAlign}>
              <Image src="/logo.png" width={45} height={45} alt="" />
            </span> */}
            <h1>Cryptoflows.info</h1>
          </a>
        </Link>
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
      </div>
      <p className={isHorizontal ? styles.questionHorizontal : styles.question}>
        Where does value flow in crypto?
      </p>
    </header>
  );
}
