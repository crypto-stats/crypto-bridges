import * as d3 from 'd3';
import { SimulationNodeDatum } from 'd3';
import { useRouter } from 'next/router';
import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import useSWR from 'swr';
import { BRIDGED_VALUE_API_URL } from '../constants';
import style from '../styles/NetworkDiagram.module.css';
import {
  convertDataForGraph,
  getDiagramDimensions,
  IGraphData,
  IGraphLink,
  IGraphNode,
} from '../utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const RATIO = 1 / 10000000;
const PADDING = 40;

const getTvlRadius = (d: any) => Math.sqrt((d.value * RATIO) / Math.PI) * 8;

function drawChart(
  svgRef: RefObject<SVGSVGElement>,
  data: IGraphData,
  navigateTo: (path: string) => void,
) {
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
    navigateTo(newPath);
  }

  function onLineClick(e: PointerEvent, i: IGraphLink) {
    e.preventDefault();
    const source: IGraphNode = i.source as any;
    const newPath = `/${
      source.type === 'bridge' ? 'bridge' : 'chain'
    }/${source.name.split(' ').join('-')}`;
    navigateTo(newPath);
  }

  const links = svg
    .selectAll('line')
    .data(data.links)
    .enter()
    .append('line')
    .style('cursor', 'pointer')
    .style('stroke', '#6d7381')
    .style('stroke-width', (d) => Math.log((d.tvl * RATIO) / 3) * 5)
    .on('click', onLineClick);

  const node = svg.selectAll('circle').data(data.nodes);
  const circleGroups = node.enter().append('g');

  const tvlCircles = circleGroups
    .append('circle')
    .attr('r', getTvlRadius)
    .style('fill', '#6d7381')
    .style('cursor', 'pointer')
    .on('click', onClick);

  const text = circleGroups
    .append('text')
    .text((d) => d.name)
    .style('fill', '#ccc')
    .style('cursor', 'pointer')
    .on('click', onClick);

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
          Math.min(d.x, width - PADDING - radius),
        );
        d.x = coord;
        return coord;
      })
      .attr('cy', (d: any) => {
        const radius = getTvlRadius(d);
        const coord = Math.max(
          PADDING + radius,
          Math.min(d.y, height - PADDING - radius),
        );
        d.y = coord;
        return coord;
      });
    text
      .attr('dx', (d: any) => d.x - d.name.length * 4.7)
      .attr('dy', (d: any) => d.y + 5);
    links
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);
  }
}

export default function NetworkDiagram() {
  const router = useRouter();
  const navigateTo = (path: string) =>
    router.push(path, undefined, { scroll: false });
  const { data, error } = useSWR(BRIDGED_VALUE_API_URL, fetcher);
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (data === undefined) return;
    const convertedData = convertDataForGraph(data);
    drawChart(svg, convertedData, navigateTo);
  }, [svg, data]);
  if (error) return null;
  if (!data) return <p>loading</p>;
  return (
    <div className={style.networkDiagram}>
      <svg ref={svg} />
    </div>
  );
}
