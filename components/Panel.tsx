import { PropsWithChildren, useEffect, useState } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import styles from '../styles/Panel.module.css';
import { getDiagramDimensions, needsLandscape } from '../utils';

export default function Content(props: PropsWithChildren) {
  const [isLandscape, setLandscape] = useState(false);
  const [graphWidth, setGraphWidth] = useState(0);
  useEffect(() => {
    const updatePanel = () => {
      const isLandscape = needsLandscape();
      setLandscape(isLandscape);
      const { width } = getDiagramDimensions();
      setGraphWidth(Math.ceil(width));
      document.body.style.overflowY = isLandscape ? 'hidden' : 'auto';
    };
    updatePanel();
    window.addEventListener('resize', updatePanel);
    return () => window.removeEventListener('resize', updatePanel);
  }, []);
  return (
    <div
      className={isLandscape ? styles.sidePanel : styles.content}
      style={{
        maxWidth: isLandscape ? `calc(100% - ${graphWidth}px)` : 'inherit',
        maxHeight: isLandscape ? `100%` : 'inherit',
      }}
    >
      {isLandscape && (
        <SimpleBar
          style={{
            maxHeight: '100%',
            width: '100%',
          }}
          forceVisible="y"
          autoHide={false}
        >
          {props.children}
        </SimpleBar>
      )}
      {!isLandscape && props.children}
    </div>
  );
}
