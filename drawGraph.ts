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

const PADDING = 20;

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

  const clickablePaths = svg
    .selectAll('line')
    .data(data.links)
    .enter()
    .append('path')
    .style('fill', 'none')
    .style('fill-opacity', 0)
    .style('cursor', 'pointer')
    .style('stroke', 'rgba(255,255,255,0)')
    .style('stroke-opacity', 0)
    .style('stroke-width', getPathWidth)
    .on('mouseover', onMouseOverLink)
    .on('mouseout', onMouseOut)
    .on('click', function (e: MouseEvent, path: IGraphLink) {
      e.preventDefault();
      const targetNode: IGraphNode = path.target as any;
      navigateTo(getPathFromNode(targetNode));
    });

  const paths = svg
    .selectAll('line')
    .data(data.links)
    .enter()
    .append('path')
    .style('stroke-dasharray', MIN_PATH_WIDTH)
    .style('fill', 'none')
    .style('fill-opacity', 0)
    .style('stroke-width', getPathWidth)
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
    .style('fill', 'none')
    .style('cursor', 'pointer')
    .on('click', onClick)
    .on('mouseover', onMouseOver)
    .on('mouseout', onMouseOut)
    .classed('highlight', true)
    .classed('circle-default', true);

  const blurredImages = circleGroups
    .append('image')
    .attr('href', (d: any) => d.imageSrc as string)
    .style('cursor', 'pointer')
    .style('filter', `url(#${IMAGE_GLOW_ID})`)
    .classed('highlight', true)
    .classed('blurred-image-default', true);

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
    paths
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
    tvlCircles.classed(
      'circle-selected',
      (c: any) => connectedNodeNames.indexOf(c.name as string) > -1,
    );
    blurredImages.classed(
      'blurred-image-selected',
      (c: any) => connectedNodeNames.indexOf(c.name as string) > -1,
    );
  }

  function onMouseOut() {
    tvlCircles.classed('circle-hovered', false);
    paths.classed('path-hovered', false).style('filter', function () {
      return select(this).classed('path-selected')
        ? `url(#${GLOW_ID})`
        : 'none';
    });
    blurredImages.classed('blurred-image-hovered', false);
  }

  function onMouseOverLink(e: MouseEvent, path: IGraphLink) {
    onMouseOver(e, path.target as any as IGraphNode);
  }

  function onMouseOver(e: MouseEvent, node: IGraphNode) {
    const connectedNodeNames: string[] = [];
    paths
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
    tvlCircles.classed(
      'circle-hovered',
      (c: any) => connectedNodeNames.indexOf(c.name as string) > -1,
    );
    blurredImages.classed(
      'blurred-image-hovered',
      (c: any) => connectedNodeNames.indexOf(c.name as string) > -1,
    );
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
    const dimensions = getDiagramDimensions();
    // Cancel resize if the dimensions have not actualy changed (as in
    // portrait mode height resize).
    if (dimensions.width === width && dimensions.height === height) {
      return;
    }
    if (currentSimulation !== undefined) {
      currentSimulation.stop();
    }
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
    blurredImages
      .attr('width', (d: any) => getTvlRadius(d) * 2)
      .attr('height', (d: any) => getTvlRadius(d) * 2)
      .attr('x', (d: any) => d.x - getTvlRadius(d))
      .attr('y', (d: any) => d.y - getTvlRadius(d));
    paths.style('stroke-width', getPathWidth);
    clickablePaths.style('stroke-width', getPathWidth);
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
    blurredImages
      .attr('x', (d: any) => d.x - getTvlRadius(d))
      .attr('y', (d: any) => d.y - getTvlRadius(d));
    const getPath = (d: any) => {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy);
      const source = dx > 0 ? d.source : d.target;
      const target = dx > 0 ? d.target : d.source;
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
    };
    paths
      .attr('d', getPath)
      .classed('dash', (d: any) => d.target.x - d.source.x > 0)
      .classed('dash-reverse', (d: any) => d.target.x - d.source.x <= 0);
    clickablePaths.attr('d', getPath);
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
      tvlCircles.classed('circle-selected', false);
      paths.classed('path-selected', false).style('filter', 'none');
      blurredImages.classed('blurred-image-selected', false);
    }
  }

  return { updateSelected };
}
