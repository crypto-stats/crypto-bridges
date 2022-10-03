import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { HEADER_HEIGHT, PANEL_WIDTH } from '../constants';
import { useData } from '../data/data-context';
import { IData } from '../data/types';
import { useStore } from '../store';
import styles from '../styles/Header.module.css';
import { needsLandscape } from '../utils';
import { FiltersModal } from './FiltersModal';

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

const checkImportExport = (
  path: string,
  data: IData,
): { hasImport: boolean; hasExport: boolean } => {
  const chain = path.split('/')[2];
  let hasImport = false;
  let hasExport = false;
  for (const flow of data.flows) {
    if (
      (flow.metadata.chainA === chain &&
        (flow.results.currentValueBridgedBToA || 0) > 0) ||
      (flow.metadata.chainB === chain &&
        (flow.results.currentValueBridgedAToB || 0) > 0)
    ) {
      hasImport = true;
    }
    if (
      (flow.metadata.chainA === chain &&
        (flow.results.currentValueBridgedAToB || 0) > 0) ||
      (flow.metadata.chainB === chain &&
        (flow.results.currentValueBridgedBToA || 0) > 0)
    ) {
      hasExport = true;
    }
  }
  return { hasImport, hasExport };
};

const ImportExport = () => {
  const { isImport, selectImport, selectExport } = useStore((state) => ({
    isImport: state.flowsShowImport,
    selectImport: state.showImportFlows,
    selectExport: state.showExportFlows,
  }));
  const { asPath } = useRouter();
  const data = useData();
  const { hasImport, hasExport } = useMemo(() => {
    return checkImportExport(asPath, data);
  }, [asPath, data]);
  useEffect(() => {
    if (isImport && !hasImport) {
      selectExport();
    }
    if (!isImport && !hasExport) {
      selectImport();
    }
  }, [hasImport, hasExport, isImport, selectExport, selectImport]);
  return (
    <>
      {hasImport && (
        <button
          onClick={selectImport}
          className={isImport ? styles.selected : ''}
        >
          Imports
        </button>
      )}
      {hasExport && (
        <button
          onClick={selectExport}
          className={!isImport ? styles.selected : ''}
        >
          Exports
        </button>
      )}
    </>
  );
};

export default function Header() {
  const router = useRouter();
  const [isHorizontal, setHorizontal] = useState(false);
  const [modalIsOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState<string[]>([]);
  const openFilters = () => setModalOpen(true);
  const closeFilters = () => setModalOpen(false);
  const resetFilters = (e) => {
    e.stopPropagation();
    setFilters([]);
  };
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
  const showFilters = !router.pathname.includes('chain');
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
      <div className={styles.buttons}>
        <div className={isHorizontal ? styles.toggle : styles.toggleVertical}>
          {router.pathname.includes('chain') ? (
            <ImportExport />
          ) : (
            <FlowBridge />
          )}
        </div>
        {showFilters && (
          <div
            className={styles.filterBox}
            onClick={() => setModalOpen(!modalIsOpen)}
          >
            <div className={styles.filterBoxContent}>
              <img src="/filter.svg" alt="filter" height="15" />
              <p>
                Filters {filters.length > 0 ? <b>({filters.length})</b> : null}
              </p>
            </div>
            {filters.length > 0 && (
              <button className={styles.removeFilters} onClick={resetFilters}>
                ×
              </button>
            )}
          </div>
        )}
      </div>
      {showFilters && (
        <FiltersModal
          isHorizontal={isHorizontal}
          show={modalIsOpen}
          closeFilters={closeFilters}
          setFilters={setFilters}
          filters={filters}
        />
      )}
    </header>
  );
}
