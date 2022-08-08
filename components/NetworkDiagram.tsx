import * as d3 from 'd3';
import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import useSWR from 'swr';
const fetcher = (url: string) => fetch(url).then((res) => res.json());

function drawChart(svgRef: RefObject<SVGSVGElement>, data: any) {
  const h = 300;
  const w = 600;
  const svg = d3.select(svgRef.current);

  svg.attr('width', w).attr('height', h).style('background', '#eee');
  const link = svg
    .selectAll('line')
    .data(data.links)
    .enter()
    .append('line')
    .style('stroke', '#aaa');

  const node = svg
    .selectAll('circle')
    .data(data.nodes)
    .enter()
    .append('circle')
    .attr('r', 20)
    .style('fill', '#69b3a2');

  // Let's list the force we wanna apply on the network
  const simulation = d3
    .forceSimulation(data.nodes)
    .force(
      'link',
      d3
        .forceLink()
        .id((d: any) => d.name)
        .links(data.links),
    )
    .force('charge', d3.forceManyBody().strength(-400))
    .force('center', d3.forceCenter(w / 2, h / 2))
    .on('tick', ticked)
    .on('end', ticked);

  // This function is run at each iteration of the force algorithm, updating the nodes position.
  function ticked() {
    link
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);

    node.attr('cx', (d: any) => d.x + 6).attr('cy', (d: any) => d.y - 6);
  }
}

export default function NetworkDiagram() {
  const { data, error } = useSWR('/data.json', fetcher);
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (data === undefined) return;
    console.log(data);
    drawChart(svg, data);
  }, [svg, data]);
  if (error) return null;
  if (!data) return <p>loading</p>;
  return (
    <div>
      <svg ref={svg} />
    </div>
  );
}
