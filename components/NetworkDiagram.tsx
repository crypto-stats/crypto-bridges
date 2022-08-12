import * as d3 from 'd3';
import { SimulationNodeDatum } from 'd3';
import { useRouter } from 'next/router';
import { RefObject, useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { BRIDGED_VALUE_API_URL } from '../constants';
import style from '../styles/NetworkDiagram.module.css';
import {
  convertDataForGraph,
  getDiagramDimensions,
  ICsApiData,
  IGraphData,
  IGraphLink,
  IGraphNode,
} from '../utils';

enum COLORS {
  DEFAULT = '#6d7381',
  SELECTED = '#D750C8',
}

interface INetworkGraph {
  updateSelected: (path: string) => void;
}

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .catch(console.error);

const RATIO = 1 / 10000000;
const PADDING = 40;

const getTvlRadius = (d: any) => Math.sqrt((d.value * RATIO) / Math.PI) * 8;

function drawGraph(
  svgRef: RefObject<SVGSVGElement>,
  data: IGraphData,
  navigateTo: (path: string) => void,
): INetworkGraph {
  let selected: IGraphNode | undefined;
  let width = 0,
    height = 0;
  let currentSimulation:
    | d3.Simulation<d3.SimulationNodeDatum, undefined>
    | undefined = undefined;
  const svg = d3.select(svgRef.current);

  function onClick(e: PointerEvent, i: IGraphNode) {
    e.preventDefault();
    const newPath = `/${i.type === 'bridge' ? 'bridge' : 'chain'}/${i.name
      .split(' ')
      .join('-')}`;
    selected = i;
    highlight();
    navigateTo(newPath);
  }

  function onLineClick(e: PointerEvent, i: IGraphLink) {
    e.preventDefault();
    const source: IGraphNode = i.source as any;
    selected = source;
    highlight();
    const newPath = `/${
      source.type === 'bridge' ? 'bridge' : 'chain'
    }/${source.name.split(' ').join('-')}`;
    navigateTo(newPath);
  }

  const links = svg
    .selectAll('line')
    .data(data.links)
    .enter()
    .append('path')
    .style('cursor', 'pointer')
    .style('stroke', COLORS.DEFAULT)
    .style('fill', 'none')
    .style('stroke-width', (d) => Math.log((d.tvl * RATIO) / 3) * 5)
    .on('click', onLineClick);

  const node = svg.selectAll('circle').data(data.nodes);
  const circleGroups = node.enter().append('g');

  const tvlCircles = circleGroups
    .append('circle')
    .attr('r', getTvlRadius)
    .style('fill', COLORS.DEFAULT)
    .style('cursor', 'pointer')
    .on('click', onClick);

  const text = circleGroups
    .append('text')
    .style('fill', '#ccc')
    .style('cursor', 'pointer')
    .attr('font-size', '1em')
    .on('click', onClick);
  text.append('tspan').text((d) => d.name.split(' ')[0]);
  text
    .append('tspan')
    .text((d) => d.name.split(' ')[1] ?? '')
    .attr('dy', '20')
    .attr('dx', (d: any) => -d.name.split(' ')[1]?.length * 9 || '0');

  const resize = () => {
    if (currentSimulation !== undefined) {
      currentSimulation.stop();
    }
    const dimensions = getDiagramDimensions();
    width = dimensions.width;
    height = dimensions.height;
    svg.attr('width', width).attr('height', height);
    currentSimulation = d3
      .forceSimulation(data.nodes as SimulationNodeDatum[])
      .force(
        'charge',
        d3.forceManyBody().strength((d: any) => {
          const force = getTvlRadius(d) / -5000;
          const availableArea = (width - PADDING) * (height - PADDING);
          return force * availableArea;
        }),
      )
      .force(
        'link',
        d3
          .forceLink()
          .id((d: any) => (d as IGraphNode).name)
          .links(data.links),
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .on('tick', ticked)
      .on('end', ticked);
  };

  resize();
  window.addEventListener('resize', resize);

  function ticked() {
    tvlCircles
      .attr('cx', (d: any) => {
        const radius = getTvlRadius(d);
        const coord = Math.max(
          PADDING + radius,
          Math.min(d.x as number, width - PADDING - radius),
        );
        d.x = coord;
        return coord;
      })
      .attr('cy', (d: any) => {
        const radius = getTvlRadius(d);
        const coord = Math.max(
          PADDING + radius,
          Math.min(d.y as number, height - PADDING - radius),
        );
        d.y = coord;
        return coord;
      });
    text
      .attr('dx', (d: any) => d.x - d.name.split(' ')[0].length * 4.7)
      .attr('dy', (d: any) => (d.y as number) + 5);
    links.attr('d', (d: any) => {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy);
      const source = dx > 0 ? d.source : d.target;
      const target = dx > 0 ? d.target : d.source;
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
    });
  }

  function findSelected(path: string): IGraphNode | undefined {
    return path.length === 1
      ? undefined
      : data.nodes.find((node) => node.name === path.split('/')[2]);
  }

  const highlight = () => {
    tvlCircles.style('fill', (d: any) => {
      if (selected === undefined || d.name !== selected.name) {
        return COLORS.DEFAULT;
      } else {
        return COLORS.SELECTED;
      }
    });
    links.style('stroke', (d: any) => {
      if (selected === undefined) {
        return COLORS.DEFAULT;
      } else if (
        (selected.type === 'bridge' && selected.name === d.target.name) ||
        (selected.type === 'blockchain' && selected.name === d.source.name)
      ) {
        return COLORS.SELECTED;
      } else {
        return COLORS.DEFAULT;
      }
    });
  };

  const updateSelected = (path: string) => {
    selected = findSelected(path);
    highlight();
  };

  updateSelected(window.location.pathname);

  return { updateSelected };
}

export default function NetworkDiagram() {
  const router = useRouter();
  const [graph, setGraph] = useState<INetworkGraph>();
  const { data, error } = useSWR(BRIDGED_VALUE_API_URL, fetcher);
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (data === undefined) return;
    if (graph !== undefined) return;
    if (svg.current !== null) {
      svg.current.innerHTML = '';
    }
    const navigateTo = (path: string) =>
      router.push(path, undefined, { scroll: false });
    const convertedData = convertDataForGraph(data as ICsApiData);
    const g = drawGraph(svg, convertedData, navigateTo);
    setGraph(g);
    const updateUrl = (path: string) => g.updateSelected(path);
    router.events.on('routeChangeStart', updateUrl);
    return () => router.events.off('routeChangeStart', updateUrl);
  }, [svg, data, router, graph]);
  if (error) return null;
  if (!data) return <p>loading</p>;
  return (
    <div className={style.networkDiagram}>
      <svg ref={svg} />
    </div>
  );
}
