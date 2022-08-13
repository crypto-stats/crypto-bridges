import type { SimulationNodeDatum } from 'd3';
import d3 from 'd3';
import type { RefObject } from 'react';
import { GLOW_ID, GRAPH_COLORS, IMAGE_SIZE_PX } from './constants';
import {
  findLinearParameters,
  findLogParameters,
  getDiagramDimensions,
  IGraphData,
  IGraphLink,
  IGraphNode,
} from './utils';

const RATIO = 1 / 10000000;

const PADDING = 40;

export interface INetworkGraph {
  updateSelected: (path: string) => void;
}

enum DISTRIBUTION {
  LOGARITHMIC,
  LINEAR,
}

// This d3 network graph implements dynamic node sizes:
// we want to apply min and max node surfaces to control the graph's clarity
// and the node repulsion force in the d3 simulation force.
// Here we find the areas distribution curve parameters given min/max
// input values and arbitrary min/max node areas as a share of the available
// surface, so that the proportions are consistent on all possible resizes.
export function drawGraph(
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

  const distribution: DISTRIBUTION = DISTRIBUTION.LINEAR;
  const sortedNodes = data.nodes.sort((a, b) => a.value - b.value);
  const maxValue = sortedNodes[sortedNodes.length - 1].value;
  const minValue = sortedNodes[0].value;
  const [kLogA, kLogB] = findLogParameters(minValue, maxValue);
  const [kLinA, kLinB] = findLinearParameters(minValue, maxValue);

  const svg = d3.select(svgRef.current);

  const links = svg
    .selectAll('line')
    .data(data.links)
    .enter()
    .append('path')
    .attr('class', 'dash')
    .style('cursor', 'pointer')
    .style('stroke', GRAPH_COLORS.DEFAULT)
    .style('stroke-dasharray', (d) => Math.log((d.tvl * RATIO) / 3) * 5)
    .style('fill', 'none')
    .style('fill-opacity', 0)
    .style('stroke-width', (d) => Math.log((d.tvl * RATIO) / 3) * 5)
    .on('click', onLineClick);

  const circleGroups = svg
    .selectAll('circle')
    .data(data.nodes)
    .enter()
    .append('g');

  const tvlCircles = circleGroups
    .append('circle')
    .attr('r', getTvlRadius)
    .style('fill', GRAPH_COLORS.DEFAULT)
    .style('cursor', 'pointer')
    .on('click', onClick);

  const images = circleGroups
    .append('image')
    .attr('href', (d: any) => d.imageSrc as string)
    .attr('width', IMAGE_SIZE_PX)
    .attr('height', IMAGE_SIZE_PX)
    .style('cursor', 'pointer')
    .on('click', onClick);

  const text = circleGroups
    .append('text')
    .style('fill', '#ccc')
    .style('cursor', 'pointer')
    .attr('font-size', '1em')
    .on('click', onClick);
  text.append('tspan');
  //.text((d) => d.name.split(' ')[0]);
  text
    .append('tspan')
    //.text((d) => d.name.split(' ')[1] ?? '')
    .attr('dy', '20')
    .attr('dx', (d: any) => -d.name.split(' ')[1]?.length * 9 || '0');

  resize();
  updateSelected(window.location.pathname);
  window.addEventListener('resize', resize);

  function getTvlRadius(d: any): number {
    const availableArea = (width - PADDING) * (height - PADDING);
    switch (distribution) {
      case DISTRIBUTION.LINEAR: {
        const areaShare = kLinA * d.value + kLinB;
        const area = availableArea * areaShare;
        return Math.sqrt(area / Math.PI);
      }
      case DISTRIBUTION.LOGARITHMIC: {
        const areaShare = kLogA * Math.log(kLogB * d.value);
        const area = availableArea * areaShare;
        return Math.sqrt(area / Math.PI);
      }
    }
  }

  function getPathFromNode(n: IGraphNode) {
    return `/${n.type === 'bridge' ? 'bridge' : 'chain'}/${n.name
      .split(' ')
      .join('-')}`;
  }

  function onClick(e: PointerEvent, i: IGraphNode) {
    e.preventDefault();
    selected = i;
    highlight();
    navigateTo(getPathFromNode(i));
  }

  function onLineClick(e: PointerEvent, i: IGraphLink) {
    e.preventDefault();
    const source: IGraphNode = i.source as any;
    selected = source;
    highlight();
    navigateTo(getPathFromNode(source));
  }

  function resize() {
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

    tvlCircles.attr('r', getTvlRadius);
  }

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
    images
      .attr('x', (d: any) => d.x - IMAGE_SIZE_PX / 2)
      .attr('y', (d: any) => d.y - IMAGE_SIZE_PX / 2);
    links
      .attr('d', (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        const source = dx > 0 ? d.source : d.target;
        const target = dx > 0 ? d.target : d.source;
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
      })
      .attr('class', (d: any) =>
        d.target.x - d.source.x > 0 ? 'dash' : 'dash-reverse',
      );
  }

  function findSelected(path: string): IGraphNode | undefined {
    return path.length === 1
      ? undefined
      : data.nodes.find(
          (node) => node.name === path.split('/')[2].split('-').join(' '),
        );
  }

  function highlight() {
    tvlCircles.style('fill', (d: any) => {
      if (selected === undefined || d.name !== selected.name) {
        return GRAPH_COLORS.DEFAULT;
      } else {
        return GRAPH_COLORS.SELECTED;
      }
    });
    links
      .style('stroke', (d: any) => {
        if (selected === undefined) {
          return GRAPH_COLORS.DEFAULT;
        } else if (
          (selected.type === 'bridge' && selected.name === d.target.name) ||
          (selected.type === 'blockchain' && selected.name === d.source.name)
        ) {
          return GRAPH_COLORS.SELECTED;
        } else {
          return GRAPH_COLORS.DEFAULT;
        }
      })
      .style('filter', (d: any) => {
        if (selected === undefined) {
          return 'none';
        } else if (
          (selected.type === 'bridge' && selected.name === d.target.name) ||
          (selected.type === 'blockchain' && selected.name === d.source.name)
        ) {
          return `url(#${GLOW_ID})`;
        } else {
          return 'none';
        }
      });
  }

  function updateSelected(path: string) {
    selected = findSelected(path);
    highlight();
  }

  return { updateSelected };
}
