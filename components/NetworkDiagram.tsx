import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { GLOW_ID, IMAGE_GLOW_ID } from '../constants';
import { drawGraph, INetworkGraph } from '../drawGraph';
import style from '../styles/NetworkDiagram.module.css';
import { convertDummyDataForGraph, IDummyData } from '../utils';

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .catch(console.error);

export default function NetworkDiagram() {
  const router = useRouter();
  const [graph, setGraph] = useState<INetworkGraph>();
  const { data } = useSWR('/dummy.json', fetcher);
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (data === undefined || graph !== undefined) return;
    if (svg.current !== null) {
      svg.current.innerHTML = `
      <defs>
      <filter id="${GLOW_ID}" width="200%" height="200%" x="-50%" y="-50%">
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
      <filter id="${IMAGE_GLOW_ID}" width="200%" height="200%" x="-50%" y="-50%">
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
    const navigateTo = (path: string) =>
      router.push(path, undefined, { scroll: false });
    const convertedData = convertDummyDataForGraph(data as IDummyData);
    const g = drawGraph(svg, convertedData, navigateTo);
    setGraph(g);
    const updateUrl = (path: string) => g.updateSelected(path);
    router.events.on('routeChangeStart', updateUrl);
  }, [svg, data, router, graph]);
  return (
    <div className={style.networkDiagram}>
      <svg ref={svg}></svg>
    </div>
  );
}
