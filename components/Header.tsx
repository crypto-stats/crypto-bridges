import Image from 'next/image';
import Link from 'next/link';
import styles from '../styles/Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <Link href={'/'} passHref={true} scroll={false}>
        <a className={styles.aContainer}>
          <Image src="/logo.png" width={45} height={45} />{' '}
          <h1>Crypto bridges</h1>
        </a>
      </Link>
    </header>
  );
}
