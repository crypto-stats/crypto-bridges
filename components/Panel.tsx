import { PropsWithChildren, useEffect, useState } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import styles from '../styles/Panel.module.css';
import { getDiagramDimensions, needsLandscape } from '../utils';

export default function Content(props: PropsWithChildren) {
  const [isLandscape, setLandscape] = useState(false);
  const [graphWidth, setGraphWidth] = useState(0);
  const [graphHeight, setGraphHeight] = useState(0);
  useEffect(() => {
    const updateToSidePanel = () => {
      const isLandscape = needsLandscape();
      setLandscape(isLandscape);
      const dimensions = getDiagramDimensions();
      setGraphWidth(Math.ceil(dimensions.width));
      setGraphHeight(Math.ceil(dimensions.height));
      document.body.style.overflowY = isLandscape ? 'hidden' : 'auto';
    };
    updateToSidePanel();
    window.addEventListener('resize', updateToSidePanel);
    return () => window.removeEventListener('resize', updateToSidePanel);
  }, []);
  return (
    <div
      className={isLandscape ? styles.sidePanel : styles.content}
      style={{
        maxWidth: isLandscape ? `calc(100% - ${graphWidth}px)` : 'inherit',
        maxHeight: isLandscape ? `100%` : 'inherit',
      }}
    >
      <SimpleBar
        style={{
          maxHeight: isLandscape ? `100%` : 'inherit',
          width: '100%',
        }}
        forceVisible="y"
        autoHide={false}
      >
        {props.children}
      </SimpleBar>
    </div>
  );
}
