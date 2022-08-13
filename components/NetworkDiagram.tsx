import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { BRIDGED_VALUE_API_URL, GLOW_ID } from '../constants';
import { drawGraph, INetworkGraph } from '../drawGraph';
import style from '../styles/NetworkDiagram.module.css';
import { convertDataForGraph, ICsApiData } from '../utils';

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .catch(console.error);

export default function NetworkDiagram() {
  const router = useRouter();
  const [graph, setGraph] = useState<INetworkGraph>();
  const { data, error } = useSWR(BRIDGED_VALUE_API_URL, fetcher);
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (data === undefined) return;
    if (graph !== undefined) return;
    if (svg.current !== null) {
      svg.current.innerHTML = `
      <defs>
        <filter id="${GLOW_ID}">
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
      </defs>`;
    }
    const navigateTo = (path: string) =>
      router.push(path, undefined, { scroll: false });
    const convertedData = convertDataForGraph(data as ICsApiData);
    const g = drawGraph(svg, convertedData, navigateTo);
    setGraph(g);
    const updateUrl = (path: string) => g.updateSelected(path);
    router.events.on('routeChangeStart', updateUrl);
  }, [svg, data, router, graph]);
  if (error) return null;
  if (!data) return <p>loading</p>;
  return (
    <div className={style.networkDiagram}>
      <svg ref={svg}></svg>
    </div>
  );
}
