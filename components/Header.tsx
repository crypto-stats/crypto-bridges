import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { HEADER_HEIGHT, PANEL_WIDTH } from '../constants';
import styles from '../styles/Header.module.css';
import { needsLandscape } from '../utils';

export default function Header() {
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
      <Link href={'/'} passHref={true} scroll={false}>
        <a className={styles.aContainer}>
          <Image src="/logo.png" width={45} height={45} />{' '}
          <h1>Cryptobridges.info</h1>
        </a>
      </Link>
    </header>
  );
}
