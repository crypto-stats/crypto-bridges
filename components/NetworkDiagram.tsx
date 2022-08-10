import * as d3 from 'd3';
import { SimulationNodeDatum } from 'd3';
import { useRouter } from 'next/router';
import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import useSWR from 'swr';
import { BLUE_1, BRIDGED_VALUE_API_URL, ORANGE_1 } from '../constants';
import { convertDataForGraph, IGraphData, IGraphNode } from '../utils';
const fetcher = (url: string) => fetch(url).then((res) => res.json());

const getNodeSize = (d) => 10;

function drawChart(
  svgRef: RefObject<SVGSVGElement>,
  data: IGraphData,
  navigateTo: (path: string) => void,
) {
  const h = 300;
  const w = 600;
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
    .style('stroke-width', (d) => 5);

  const node = svg.selectAll('circle').data(data.nodes);
  const circleGroups = node.enter().append('g');
  const circles = circleGroups
    .append('circle')
    .attr('r', getNodeSize)
    .style('fill', (d: any) => (d.type === 'bridge' ? ORANGE_1 : BLUE_1));
  const text = circleGroups
    .append('text')
    .text((d) => d.name)
    .style('cursor', 'pointer')
    .on('click', onClick);

  d3.forceSimulation(data.nodes as SimulationNodeDatum[])
    .force(
      'link',
      d3
        .forceLink()
        .id((d: any) => (d as IGraphNode).name)
        .links(data.links),
    )
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(w / 2, h / 2))
    .on('tick', ticked)
    .on('end', ticked);

  function ticked() {
    links
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);
    circles.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
    text
      .attr('dx', (d: any) => d.x - d.name.length * 4.7)
      .attr('dy', (d: any) => d.y + 5);
  }
}

export default function NetworkDiagram() {
  const router = useRouter();
  const navigateTo = (path: string) => router.push(path);
  const { data, error } = useSWR(BRIDGED_VALUE_API_URL, fetcher);
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (data === undefined) return;
    console.log(data);
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
