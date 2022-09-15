import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { HEADER_HEIGHT, PANEL_WIDTH } from '../constants';
import { useStore } from '../store';
import styles from '../styles/Header.module.css';
import { needsLandscape } from '../utils';

const FlowBridge = () => {
  const router = useRouter();
  const selectBridges = () => router.push('/bridges/');
  const selectFlow = () => router.push('/');
  return (
    <>
      <button
        onClick={selectFlow}
        className={router.pathname === '/' ? styles.selected : ''}
      >
        Flow view
      </button>
      <button
        onClick={selectBridges}
        className={router.pathname.includes('/bridges') ? styles.selected : ''}
      >
        Bridge view
      </button>
    </>
  );
};

const ImportExport = () => {
  const { isImport, selectImport, selectExport } = useStore((state) => ({
    isImport: state.flowsShowImport,
    selectImport: state.showImportFlows,
    selectExport: state.showExportFlows,
  }));
  return (
    <>
      <button
        onClick={selectImport}
        className={isImport ? styles.selected : ''}
      >
        Imports
      </button>
      <button
        onClick={selectExport}
        className={!isImport ? styles.selected : ''}
      >
        Exports
      </button>
    </>
  );
};

export default function Header() {
  const router = useRouter();
  const [isHorizontal, setHorizontal] = useState(false);
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const updateToSidePanel = () => {
      const isLandscape = needsLandscape();
      setHorizontal(isLandscape);
      if (el.current !== null) {
        el.current.style.width = `calc(100% - ${
          isLandscape ? PANEL_WIDTH : 0
        }px)`;
        el.current.style.height = isLandscape ? `${HEADER_HEIGHT}px` : 'auto';
      }
    };
    updateToSidePanel();
    window.addEventListener('resize', updateToSidePanel);
    return () => window.removeEventListener('resize', updateToSidePanel);
  }, [setHorizontal]);
  return (
    <header
      className={isHorizontal ? styles.headerHorizontal : styles.header}
      ref={el}
    >
      <div className={isHorizontal ? '' : styles.vertical}>
        <div className={isHorizontal ? styles.oneline : styles.onelineVertical}>
          <Link href={`/`} passHref={true} scroll={false}>
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
                    width={15}
                    height={15}
                    className={styles.verticalAlign}
                  />
                </span>{' '}
                CryptoStats
              </b>
            </a>
          </p>
        </div>
        <p className={isHorizontal ? styles.question : styles.questionVertical}>
          Where does value flow in crypto?
        </p>
      </div>
      <div className={isHorizontal ? styles.toggle : styles.toggleVertical}>
        {router.pathname.includes('chain') ? <ImportExport /> : <FlowBridge />}
      </div>
    </header>
  );
}
