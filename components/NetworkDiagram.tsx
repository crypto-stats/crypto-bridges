import * as d3 from 'd3';
import { SimulationNodeDatum } from 'd3';
import { useRouter } from 'next/router';
import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import useSWR from 'swr';
import { BRIDGED_VALUE_API_URL, ORANGE_1 } from '../constants';
import { convertDataForGraph, IGraphData, IGraphNode } from '../utils';
const fetcher = (url: string) => fetch(url).then((res) => res.json());

const RATIO = 1 / 10000000;
const PADDING = 40;

const getTvlRadius = (d: any) => Math.sqrt((d.value * RATIO) / Math.PI) * 8;

function drawChart(
  svgRef: RefObject<SVGSVGElement>,
  data: IGraphData,
  navigateTo: (path: string) => void,
) {
  const h = 600;
  let w = innerWidth;
  let currentSimulation:
    | d3.Simulation<d3.SimulationNodeDatum, undefined>
    | undefined = undefined;
  const svg = d3.select(svgRef.current);

  function onClick(e: PointerEvent, i: IGraphNode) {
    e.preventDefault();
    const newPath = `/${i.type === 'bridge' ? 'bridge' : 'chain'}/${i.name}`;
    navigateTo(newPath);
  }

  svg.attr('width', w).attr('height', h).style('background', '#eee');

  const links = svg
    .selectAll('line')
    .data(data.links)
    .enter()
    .append('line')
    .style('stroke', ORANGE_1)
    .style('stroke-width', (d) => Math.log((d.tvl * RATIO) / 3) * 5);

  const node = svg.selectAll('circle').data(data.nodes);
  const circleGroups = node.enter().append('g');

  const tvlCircles = circleGroups
    .append('circle')
    .attr('r', getTvlRadius)
    .style('fill', '#ddd')
    .attr('stroke-width', '1')
    .attr('stroke', '#ccc');

  const text = circleGroups
    .append('text')
    .text((d) => d.name)
    .style('cursor', 'pointer')
    .on('click', onClick);

  const resize = () => {
    if (currentSimulation !== undefined) {
      currentSimulation.stop();
    }
    svg.attr('width', w);
    currentSimulation = d3
      .forceSimulation(data.nodes as SimulationNodeDatum[])
      .force(
        'charge',
        d3.forceManyBody().strength((d: any) => {
          const force = getTvlRadius(d) / -5000;
          const availableArea = (w - PADDING) * (h - PADDING);
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
      .force('center', d3.forceCenter(w / 2, h / 2))
      .on('tick', ticked)
      .on('end', ticked);
  };

  resize();
  window.addEventListener('resize', () => {
    w = innerWidth;
    resize();
  });

  function ticked() {
    tvlCircles
      .attr('cx', (d: any) => {
        const radius = getTvlRadius(d);
        const coord = Math.max(
          PADDING + radius,
          Math.min(d.x, w - PADDING - radius),
        );
        d.x = coord;
        return coord;
      })
      .attr('cy', (d: any) => {
        const radius = getTvlRadius(d);
        const coord = Math.max(
          PADDING + radius,
          Math.min(d.y, h - PADDING - radius),
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
    <div>
      <svg ref={svg} />
    </div>
  );
}
