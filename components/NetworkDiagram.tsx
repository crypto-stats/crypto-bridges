import * as d3 from 'd3';
import { useRouter } from 'next/router';
import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import useSWR from 'swr';
const fetcher = (url: string) => fetch(url).then((res) => res.json());

const COLOR_1 = '#45a2e1';
const COLOR_2 = '#ef984d';

const getNodeSize = (d: any) => (d.type === 'bridge' ? d.tvl : d.mc / 10);

function drawChart(
  svgRef: RefObject<SVGSVGElement>,
  data: any,
  navigateTo: (path: string) => void,
) {
  const h = 300;
  const w = 600;
  const svg = d3.select(svgRef.current);

  function onClick(d: PointerEvent, i: any) {
    const newPath = `/${i.type === 'bridge' ? 'bridge' : 'chain'}/${i.name}`;
    navigateTo(newPath);
  }

  svg.attr('width', w).attr('height', h).style('background', '#eee');
  const links = svg
    .selectAll('line')
    .data(data.links)
    .enter()
    .append('line')
    .style('stroke', COLOR_2)
    .style('stroke-width', (d: any) => d.tvl * 3);

  const node = svg.selectAll('circle').data(data.nodes);
  const circleGroups = node.enter().append('g');
  const circles = circleGroups
    .append('circle')
    .attr('r', getNodeSize)
    .style('fill', (d: any) => (d.type === 'bridge' ? COLOR_2 : COLOR_1));
  const text = circleGroups
    .append('text')
    .text((d) => d.name)
    .style('cursor', 'pointer')
    .on('click', onClick);

  d3.forceSimulation(data.nodes)
    .force(
      'link',
      d3
        .forceLink()
        .id((d: any) => d.name)
        .links(data.links),
    )
    .force('charge', d3.forceManyBody().strength(-1000))
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
  const { data, error } = useSWR('/data.json', fetcher);
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (data === undefined) return;
    drawChart(svg, data, navigateTo);
  }, [svg, data]);
  if (error) return null;
  if (!data) return <p>loading</p>;
  return (
    <div>
      <svg ref={svg} />
    </div>
  );
}
