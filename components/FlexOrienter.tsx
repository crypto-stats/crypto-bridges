import { PropsWithChildren, useEffect, useState } from 'react';
import styles from '../styles/FlexOrienter.module.css';
import { useHorizontalLayout } from '../utils';

export function FlexOrienter(props: PropsWithChildren) {
  const [isLandscape, setLandscape] = useState(false);
  useEffect(() => {
    const updateToSidePanel = () => {
      setLandscape(useHorizontalLayout());
    };
    updateToSidePanel();
    window.addEventListener('resize', updateToSidePanel);
    return () => window.removeEventListener('resize', updateToSidePanel);
  }, []);
  return (
    <div
      className={
        isLandscape
          ? styles.flexOrienterHorizontal
          : styles.flexOrienterVertical
      }
    >
      {props.children}
    </div>
  );
}
