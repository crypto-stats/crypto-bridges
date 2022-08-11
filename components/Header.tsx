import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { HEADER_HEIGHT } from '../constants';
import styles from '../styles/Header.module.css';

export default function Header() {
  const el = useRef<HTMLDivElement>(null);
  if (el.current !== null) {
    el.current.style.height = `${HEADER_HEIGHT}px`;
  }
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
