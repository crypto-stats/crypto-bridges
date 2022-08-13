import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  select,
  SimulationNodeDatum,
} from 'd3';
import type { RefObject } from 'react';
import {
  GLOW_ID,
  IMAGE_GLOW_ID,
  MIN_PATH_WIDTH,
  NODE_AREAS_SHARE,
} from './constants';
import {
  findLinearParameters,
  findLogParameters,
  getDiagramDimensions,
  IGraphData,
  IGraphLink,
  IGraphNode,
} from './utils';

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
  let width = 0,
    height = 0;
  let availableArea = (width - PADDING) * (height - PADDING);
  let currentSimulation:
    | d3.Simulation<d3.SimulationNodeDatum, undefined>
    | undefined = undefined;

  const distribution: DISTRIBUTION = DISTRIBUTION.LINEAR;
  const sortedNodes = data.nodes.sort((a, b) => a.value - b.value);
  const [kLogAN, kLogBN] = findLogParameters(
    sortedNodes[0].value,
    sortedNodes[sortedNodes.length - 1].value,
    NODE_AREAS_SHARE.MIN,
    NODE_AREAS_SHARE.MAX,
  );
  const [kLinAN, kLinBN] = findLinearParameters(
    sortedNodes[0].value,
    sortedNodes[sortedNodes.length - 1].value,
    NODE_AREAS_SHARE.MIN,
    NODE_AREAS_SHARE.MAX,
  );
  const sortedLinks = data.links.sort((a, b) => a.tvl - b.tvl);
  let [kAP, kBP] = getPathWidthParameters();

  const svg = select(svgRef.current);

  const links = svg
    .selectAll('line')
    .data(data.links)
    .enter()
    .append('path')
    .style('cursor', 'pointer')
    .style('stroke-dasharray', MIN_PATH_WIDTH)
    .style('fill', 'none')
    .style('fill-opacity', 0)
    .style('stroke-width', getPathWidth)
    .on('click', function (e: MouseEvent, path: IGraphLink) {
      e.preventDefault();
      const sourceNode: IGraphNode = path.source as any;
      navigateTo(getPathFromNode(sourceNode));
    })
    .classed('dash', true)
    .classed('highlight', true)
    .classed('path-default', true);

  const circleGroups = svg
    .selectAll('circle')
    .data(data.nodes)
    .enter()
    .append('g');

  const tvlCircles = circleGroups
    .append('circle')
    .attr('r', getTvlRadius)
    .style('cursor', 'pointer')
    .on('click', onClick)
    .on('mouseover', onMouseOver)
    .on('mouseout', onMouseOut)
    .classed('highlight', true)
    .classed('circle-default', true);

  const images = circleGroups
    .append('image')
    .attr('href', (d: any) => d.imageSrc as string)
    .style('cursor', 'pointer')
    .on('mouseover', onMouseOver)
    .on('mouseout', onMouseOut)
    .on('click', onClick);

  const text = circleGroups
    .append('text')
    .style('fill', '#ccc')
    .style('cursor', 'pointer')
    .attr('font-size', '1em')
    .on('click', function (e: MouseEvent, d: any) {
      console.log(d);
    });
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

  function highlightNode(node: IGraphNode) {
    const connectedNodeNames: string[] = [];
    links
      .classed('path-selected', (d: any) => {
        if (d.source.name === node.name || d.target.name === node.name) {
          connectedNodeNames.push(d.source.name as string);
          connectedNodeNames.push(d.target.name as string);
          return true;
        }
        return false;
      })
      .style('filter', (d: any) =>
        d.source.name === node.name || d.target.name === node.name
          ? `url(#${GLOW_ID})`
          : 'none',
      );
    tvlCircles
      .classed(
        'circle-selected',
        (c: any) => connectedNodeNames.indexOf(c.name as string) > -1,
      )
      .style('filter', (c: any) =>
        connectedNodeNames.indexOf(c.name as string) > -1
          ? `url(#${IMAGE_GLOW_ID})`
          : 'none',
      );
    images.style('filter', (d: any) =>
      connectedNodeNames.indexOf(d.name as string) > -1
        ? `url(#${IMAGE_GLOW_ID})`
        : 'none',
    );
  }

  function onMouseOut() {
    tvlCircles.classed('circle-hovered', false).style('filter', function () {
      return select(this).classed('circle-selected')
        ? `url(#${IMAGE_GLOW_ID})`
        : 'none';
    });
    links.classed('path-hovered', false).style('filter', function () {
      return select(this).classed('path-selected')
        ? `url(#${GLOW_ID})`
        : 'none';
    });
  }

  function onMouseOver(e: MouseEvent, node: IGraphNode) {
    const connectedNodeNames: string[] = [];
    links
      .classed('path-hovered', (d: any) => {
        if (d.source.name === node.name || d.target.name === node.name) {
          connectedNodeNames.push(d.source.name as string);
          connectedNodeNames.push(d.target.name as string);
          return true;
        }
        return false;
      })
      .style('filter', function (d: any) {
        return d.source.name === node.name ||
          d.target.name === node.name ||
          select(this).classed('path-selected')
          ? `url(#${GLOW_ID})`
          : 'none';
      });
    tvlCircles
      .classed(
        'circle-hovered',
        (c: any) => connectedNodeNames.indexOf(c.name as string) > -1,
      )
      .style('filter', function (c: any) {
        return connectedNodeNames.indexOf(c.name as string) > -1 ||
          select(this).classed('circle-selected')
          ? `url(#${IMAGE_GLOW_ID})`
          : 'none';
      });
  }

  function onClick(e: MouseEvent, node: IGraphNode) {
    e.preventDefault();
    highlightNode(node);
    navigateTo(getPathFromNode(node));
  }

  function getPathWidthParameters(): [number, number] {
    const maxNodeArea = NODE_AREAS_SHARE.MAX * availableArea;
    const maxNodeRadius = Math.sqrt(maxNodeArea / Math.PI);
    const maxPathWidthNodeRadiusRatio =
      sortedLinks[sortedLinks.length - 1].tvl /
      sortedNodes[sortedNodes.length - 1].value;
    const maxPathWidth = maxNodeRadius * maxPathWidthNodeRadiusRatio;
    switch (distribution) {
      case DISTRIBUTION.LINEAR: {
        return findLinearParameters(
          sortedLinks[0].tvl,
          sortedLinks[sortedLinks.length - 1].tvl,
          MIN_PATH_WIDTH,
          maxPathWidth,
        );
      }
      case DISTRIBUTION.LOGARITHMIC: {
        return findLogParameters(
          sortedLinks[0].tvl,
          sortedLinks[sortedLinks.length - 1].tvl,
          MIN_PATH_WIDTH,
          maxPathWidth,
        );
      }
    }
  }

  function getPathWidth(d: any): number {
    switch (distribution) {
      case DISTRIBUTION.LINEAR: {
        const width = kAP * d.tvl + kBP;
        return width;
      }
      case DISTRIBUTION.LOGARITHMIC: {
        const width = kAP * Math.log(kBP * d.tvl);
        return width;
      }
    }
  }

  function getTvlRadius(d: any): number {
    switch (distribution) {
      case DISTRIBUTION.LINEAR: {
        const areaShare = kLinAN * d.value + kLinBN;
        const area = availableArea * areaShare;
        return Math.sqrt(area / Math.PI);
      }
      case DISTRIBUTION.LOGARITHMIC: {
        const areaShare = kLogAN * Math.log(kLogBN * d.value);
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

  function resize() {
    if (currentSimulation !== undefined) {
      currentSimulation.stop();
    }
    const dimensions = getDiagramDimensions();
    width = dimensions.width;
    height = dimensions.height;
    availableArea = (width - PADDING) * (height - PADDING);
    [kAP, kBP] = getPathWidthParameters();

    svg.attr('width', width).attr('height', height);
    currentSimulation = forceSimulation(data.nodes as SimulationNodeDatum[])
      .force(
        'charge',
        forceManyBody().strength((d: any) => {
          const force = getTvlRadius(d) / -5000;
          return force * availableArea;
        }),
      )
      .force(
        'link',
        forceLink()
          .id((d: any) => (d as IGraphNode).name)
          .links(data.links),
      )
      .force('center', forceCenter(width / 2, height / 2))
      .on('tick', ticked)
      .on('end', ticked);

    tvlCircles.attr('r', getTvlRadius);
    images
      .attr('width', (d: any) => getTvlRadius(d) * 2)
      .attr('height', (d: any) => getTvlRadius(d) * 2)
      .attr('x', (d: any) => d.x - getTvlRadius(d))
      .attr('y', (d: any) => d.y - getTvlRadius(d));
    links.style('stroke-width', getPathWidth);
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
      .attr('x', (d: any) => d.x - getTvlRadius(d))
      .attr('y', (d: any) => d.y - getTvlRadius(d));
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
      .classed('dash', (d: any) => d.target.x - d.source.x > 0)
      .classed('dash-reverse', (d: any) => d.target.x - d.source.x <= 0);
  }

  function findSelected(path: string): IGraphNode | undefined {
    return path.length === 1
      ? undefined
      : data.nodes.find(
          (node) => node.name === path.split('/')[2].split('-').join(' '),
        );
  }

  function updateSelected(path: string) {
    const selected = findSelected(path);
    if (selected !== undefined) {
      highlightNode(selected);
    } else {
      tvlCircles.classed('circle-selected', false).style('filter', 'none');
      links.classed('path-selected', false).style('filter', 'none');
      images.style('filter', 'none');
    }
  }

  return { updateSelected };
}
