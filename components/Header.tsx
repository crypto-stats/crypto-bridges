import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { HEADER_HEIGHT, PANEL_WIDTH } from '../constants';
import styles from '../styles/Header.module.css';
import { needsLandscape } from '../utils';

export default function Header() {
  const router = useRouter();
  const [isHorizontal, setHorizontal] = useState(false);
  const [isFlowView, setFlowView] = useState(false);
  const selectBridge = () => {
    router.push({ pathname: router.pathname, query: { view: 'bridges' } });
    setFlowView(false);
  };
  const selectFlow = () => {
    router.push({ pathname: router.pathname, query: { view: 'flow' } });
    setFlowView(true);
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
    const fixQuery = () => {
      router.push({ pathname: router.pathname, query: { view: 'flow' } });
      setFlowView(true);
    };
    const url = router.asPath.split('?') as [string] | [string, string];
    const query1 = url[1]?.split('&')[0];
    if (query1 === undefined) {
      fixQuery();
    } else {
      const [query1Param, query1Value] = query1.split('=');
      if (
        query1Param !== 'view' ||
        !['bridges', 'flow'].includes(query1Value)
      ) {
        fixQuery();
      }
      if (query1Value === 'flow') {
        setFlowView(true);
      }
    }
    return () => window.removeEventListener('resize', updateToSidePanel);
  }, [setHorizontal, router, setFlowView]);
  return (
    <header
      className={isHorizontal ? styles.headerHorizontal : styles.header}
      ref={el}
    >
      <div className={isHorizontal ? '' : styles.vertical}>
        <div className={isHorizontal ? styles.oneline : styles.onelineVertical}>
          <Link
            href={`/?view=${
              (router.query.view as string | undefined) ?? 'flow'
            }`}
            passHref={true}
            scroll={false}
          >
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
        <button
          onClick={selectFlow}
          className={isFlowView ? styles.selected : ''}
        >
          Flow view
        </button>
        <button
          onClick={selectBridge}
          className={isFlowView ? '' : styles.selected}
        >
          Bridge view
        </button>
      </div>
    </header>
  );
}
