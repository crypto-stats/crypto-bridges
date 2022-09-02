import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { GLOW_ID, IMAGE_GLOW_ID } from '../constants';
import { useData } from '../data/data-context';
import { drawGraph } from '../drawGraph';
import style from '../styles/NetworkDiagram.module.css';
import { convertDummyDataForGraph } from '../utils';

export default function NetworkDiagram() {
  const router = useRouter();
  const [graphReady, setGraphReady] = useState(false);
  const data = useData();
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (data === undefined || graphReady) return;
    if (svg.current !== null) {
      svg.current.innerHTML = `
      <defs>
      <filter id="${GLOW_ID}" width="300%" height="300%" x="-100%" y="-100%">
        <fegaussianblur
          class="blur"
          result="coloredBlur"
          stddeviation="3"
        ></fegaussianblur>
        <femerge>
          <femergenode in="coloredBlur"></femergenode>
          <femergenode in="SourceGraphic"></femergenode>
        </femerge>
      </filter>
      <filter id="${IMAGE_GLOW_ID}" width="300%" height="300%" x="-100%" y="-100%">
        <fegaussianblur
          class="blur"
          result="coloredBlur"
          stddeviation="10"
        ></fegaussianblur>
        <femerge>
        <femergenode in="coloredBlur"></femergenode>
        </femerge>
      </filter>
      </defs>`;
    }
    setGraphReady(true);
    const convertedData = convertDummyDataForGraph(data);
    const navigateTo = (path: string) =>
      router.push(path, undefined, { scroll: false });
    const graph = drawGraph(svg, convertedData, navigateTo);
    const updateUrl = (path: string) => graph.updateSelected(path);
    router.events.on('routeChangeStart', updateUrl);
  }, [svg, data, router, graphReady]);

  return (
    <div className={style.networkDiagram}>
      <svg ref={svg}></svg>
    </div>
  );
}
