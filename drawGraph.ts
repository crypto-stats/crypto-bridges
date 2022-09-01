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
  IFlowBridgesGraphBridgeLink,
  IFlowBridgesGraphData,
  IFlowBridgesGraphFlowLink,
  IFlowBridgesGraphNode,
} from './utils';

const PADDING = 30;

const MIN_PATH_CLICK_WIDTH = 40;

export enum GRAPH_MODES {
  FLOWS,
  BRIDGES,
  SANKEY,
}

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
  data: IFlowBridgesGraphData,
  navigateTo: (path: string) => void,
): INetworkGraph {
  let mode = GRAPH_MODES.FLOWS;
  let width = 0,
    height = 0;
  let availableArea = (width - PADDING) * (height - PADDING);
  let currentSimulation:
    | d3.Simulation<d3.SimulationNodeDatum, undefined>
    | undefined = undefined;

  const distribution: DISTRIBUTION = DISTRIBUTION.LINEAR;
  const sortedNodes = data.nodes.sort((a, b) => a.tvl - b.tvl);
  const [kLogAN, kLogBN] = findLogParameters(
    sortedNodes[0].tvl,
    sortedNodes[sortedNodes.length - 1].tvl,
    NODE_AREAS_SHARE.MIN,
    NODE_AREAS_SHARE.MAX,
  );
  const [kLinAN, kLinBN] = findLinearParameters(
    sortedNodes[0].tvl,
    sortedNodes[sortedNodes.length - 1].tvl,
    NODE_AREAS_SHARE.MIN,
    NODE_AREAS_SHARE.MAX,
  );
  const sortedLinks = data.links.sort((a, b) => a.flow - b.flow);
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
    .on('mouseover', onMouseOverPath)
    .on('mouseout', onMouseOut)
    .on(
      'click',
      function (
        e: MouseEvent,
        path: IFlowBridgesGraphBridgeLink | IFlowBridgesGraphFlowLink,
      ) {
        e.preventDefault();
        let link;
        console.log(path);
        if (
          (path as IFlowBridgesGraphBridgeLink & IFlowBridgesGraphFlowLink)
            .type !== undefined
        ) {
          link = getLinkFromBridgePath(path as IFlowBridgesGraphBridgeLink);
        } else {
          link = '/';
        }
        navigateTo(link);
      },
    );

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
    .style('fill', '#311c42')
    .style('stroke-width', '4')
    .style('cursor', 'pointer')
    .on('click', onClick)
    .on('mouseover', onMouseOverNode)
    .on('mouseout', onMouseOut)
    .classed('highlight', true)
    .classed('circle-default', true);

  const blurredImages = circleGroups
    .append('image')
    .attr('href', (d: any) => d.logo as string)
    .style('cursor', 'pointer')
    .style('filter', `url(#${IMAGE_GLOW_ID})`)
    .classed('highlight', true)
    .classed('blurred-image-default', true);

  const images = circleGroups
    .append('image')
    .attr('href', (d: any) => d.logo as string)
    .style('cursor', 'pointer')
    .on('mouseover', onMouseOverNode)
    .on('mouseout', onMouseOut)
    .on('click', onClick);

  const text = circleGroups
    .append('text')
    .style('fill', '#ccc')
    .style('cursor', 'pointer')
    .attr('font-size', '1em');
  text.append('tspan');
  //.text((d) => d.chain.split(' ')[0]);
  text
    .append('tspan')
    //.text((d) => d.chain.split(' ')[1] ?? '')
    .attr('dy', '20')
    .attr('dx', (d: any) => -d.chain.split(' ')[1]?.length * 9 || '0');

  resize();
  updateSelected(window.location.pathname);
  window.addEventListener('resize', resize);

  function highlightChain(node?: IFlowBridgesGraphNode) {
    if (node === undefined) {
      return unselectAll();
    }
    const connectedNodeNames: string[] = [];
    paths
      .classed('path-selected', (d: any) => {
        if (d.source.chain === node.chain || d.target.chain === node.chain) {
          connectedNodeNames.push(d.source.chain as string);
          connectedNodeNames.push(d.target.chain as string);
          return true;
        }
        return false;
      })
      .style('filter', (d: any) =>
        d.source.chain === node.chain || d.target.chain === node.chain
          ? `url(#${GLOW_ID})`
          : 'none',
      );
    tvlCircles.classed(
      'circle-selected',
      (c: any) => connectedNodeNames.indexOf(c.chain as string) > -1,
    );
    blurredImages.classed(
      'blurred-image-selected',
      (c: any) => connectedNodeNames.indexOf(c.chain as string) > -1,
    );
  }

  function highlightBridge(link?: IFlowBridgesGraphBridgeLink) {
    if (link === undefined) {
      return unselectAll();
    }
    paths
      .classed(
        'path-selected',
        (d: any) => d.bridge === link.bridge && d.bridge !== undefined,
      )
      .style('filter', (d: any) =>
        d.bridge === link.bridge && d.bridge !== undefined
          ? `url(#${GLOW_ID})`
          : 'none',
      );
    tvlCircles.classed('circle-selected', false);
    blurredImages.classed('blurred-image-selected', false);
  }

  function onMouseOut() {
    tvlCircles.classed('circle-hovered', false).style('filter', function () {
      return select(this).classed('circle-selected')
        ? `url(#${GLOW_ID})`
        : 'none';
    });
    paths.classed('path-hovered', false).style('filter', function () {
      return select(this).classed('path-selected')
        ? `url(#${GLOW_ID})`
        : 'none';
    });
    blurredImages.classed('blurred-image-hovered', false);
  }

  function onMouseOverPath(
    e: MouseEvent,
    path: IFlowBridgesGraphBridgeLink | IFlowBridgesGraphFlowLink,
  ) {
    if (
      (path as IFlowBridgesGraphBridgeLink & IFlowBridgesGraphFlowLink).type !==
      undefined
    ) {
      onMouseOverBridge((path as IFlowBridgesGraphBridgeLink).bridge);
    } else {
      onMouseOverFlow(path as IFlowBridgesGraphFlowLink);
    }
  }

  function onMouseOverFlow(path: IFlowBridgesGraphFlowLink) {
    paths
      .classed(
        'path-hovered',
        (d: any) =>
          (d.source.chain === (path.source as any).chain &&
            d.target.chain === (path.target as any).chain) ||
          (d.target.chain === (path.source as any).chain &&
            d.source.chain === (path.target as any).chain),
      )
      .style('filter', function (d: any) {
        return (d.source.chain === (path.source as any).chain &&
          d.target.chain === (path.target as any).chain) ||
          (d.target.chain === (path.source as any).chain &&
            d.source.chain === (path.target as any).chain) ||
          select(this).classed('path-selected')
          ? `url(#${GLOW_ID})`
          : 'none';
      });

    tvlCircles
      .classed('circle-hovered', function (c: any) {
        return (
          (path.source as any).chain === c.chain ||
          (path.target as any).chain === c.chain
        );
      })
      .style('filter', function (d: any) {
        return (path.source as any).chain === d.chain ||
          (path.target as any).chain === d.chain ||
          select(this).classed('circle-selected')
          ? `url(#${GLOW_ID})`
          : 'none';
      });
    blurredImages.classed(
      'blurred-image-hovered',
      (c: any) =>
        (path.source as any).chain === c.chain ||
        (path.target as any).chain === c.chain,
    );
  }

  function onMouseOverBridge(bridge: string) {
    paths
      .classed('path-hovered', (d: any) => d.bridge === bridge)
      .style('filter', function (d: any) {
        return d.bridge === bridge || select(this).classed('path-selected')
          ? `url(#${GLOW_ID})`
          : 'none';
      });
  }

  function onMouseOverNode(e: MouseEvent, node: IFlowBridgesGraphNode) {
    const connectedNodeNames: string[] = [];
    paths
      .classed('path-hovered', (d: any) => {
        if (d.source.chain === node.chain || d.target.chain === node.chain) {
          connectedNodeNames.push(d.source.chain as string);
          connectedNodeNames.push(d.target.chain as string);
          return true;
        }
        return false;
      })
      .style('filter', function (d: any) {
        return d.source.chain === node.chain ||
          d.target.chain === node.chain ||
          select(this).classed('path-selected')
          ? `url(#${GLOW_ID})`
          : 'none';
      });
    tvlCircles
      .classed(
        'circle-hovered',
        (c: any) => connectedNodeNames.indexOf(c.chain as string) > -1,
      )
      .style('filter', function (d: any) {
        return connectedNodeNames.indexOf(d.chain as string) > -1
          ? `url(#${GLOW_ID})`
          : 'none';
      });
    blurredImages.classed(
      'blurred-image-hovered',
      (c: any) => connectedNodeNames.indexOf(c.chain as string) > -1,
    );
  }

  function setMode(newMode: GRAPH_MODES) {
    mode = newMode;
    paths.classed('path-hidden', (d: any) => {
      if (
        (mode === GRAPH_MODES.BRIDGES && d.type === undefined) ||
        (mode === GRAPH_MODES.FLOWS && d.type !== undefined)
      ) {
        return true;
      }
      return false;
    });
    clickablePaths.classed('path-hidden', (d: any) => {
      if (
        (mode === GRAPH_MODES.BRIDGES && d.type === undefined) ||
        (mode === GRAPH_MODES.FLOWS && d.type !== undefined)
      ) {
        return true;
      }
      return false;
    });
  }

  function onClick(e: MouseEvent, node: IFlowBridgesGraphNode) {
    e.preventDefault();
    highlightChain(node);
    navigateTo(getLinkFromNode(node));
  }

  function getPathWidthParameters(): [number, number] {
    const maxNodeArea = NODE_AREAS_SHARE.MAX * availableArea;
    const maxNodeRadius = Math.sqrt(maxNodeArea / Math.PI);
    const maxPathWidthNodeRadiusRatio =
      sortedLinks[sortedLinks.length - 1].flow /
      sortedNodes[sortedNodes.length - 1].tvl;
    const maxPathWidth = maxNodeRadius * maxPathWidthNodeRadiusRatio;
    switch (distribution) {
      case DISTRIBUTION.LINEAR: {
        return findLinearParameters(
          sortedLinks[0].flow,
          sortedLinks[sortedLinks.length - 1].flow,
          MIN_PATH_WIDTH,
          maxPathWidth,
        );
      }
      case DISTRIBUTION.LOGARITHMIC: {
        return findLogParameters(
          sortedLinks[0].flow,
          sortedLinks[sortedLinks.length - 1].flow,
          MIN_PATH_WIDTH,
          maxPathWidth,
        );
      }
    }
  }

  function getPathWidth(d: any): number {
    if (d.flow === 0) {
      return 0;
    }
    switch (distribution) {
      case DISTRIBUTION.LINEAR: {
        const width = kAP * d.flow + kBP;
        return width;
      }
      case DISTRIBUTION.LOGARITHMIC: {
        const width = kAP * Math.log(kBP * d.flow);
        return width;
      }
    }
  }

  function getTvlRadius(d: any): number {
    switch (distribution) {
      case DISTRIBUTION.LINEAR: {
        const areaShare = kLinAN * d.tvl + kLinBN;
        const area = availableArea * areaShare;
        return Math.sqrt(area / Math.PI);
      }
      case DISTRIBUTION.LOGARITHMIC: {
        const areaShare = kLogAN * Math.log(kLogBN * d.tvl);
        const area = availableArea * areaShare;
        return Math.sqrt(area / Math.PI);
      }
    }
  }

  function getLinkFromNode(n: IFlowBridgesGraphNode): string {
    return `/chain/${n.chain.split(' ').join('-')}`;
  }

  function getLinkFromBridgePath(p: IFlowBridgesGraphBridgeLink): string {
    const link = `/bridges/${p.bridge.split(' ').join('-')}`;
    console.log(link);
    return link;
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
          .id((d: any) => (d as IFlowBridgesGraphNode).chain)
          .links(data.links),
      )
      .force('center', forceCenter(width / 2, height / 2))
      .on('tick', ticked)
      .on('end', ticked);

    const LOGO_SIZE =
      Math.sqrt((NODE_AREAS_SHARE.MIN * availableArea) / Math.PI) *
      2 *
      Math.cos(Math.PI / 4) *
      0.8;

    tvlCircles.attr('r', getTvlRadius);
    images
      .attr('width', LOGO_SIZE)
      .attr('height', LOGO_SIZE)
      .attr('x', (d: any) => d.x - LOGO_SIZE / 2)
      .attr('y', (d: any) => d.y - LOGO_SIZE / 2);
    blurredImages
      .attr('width', LOGO_SIZE)
      .attr('height', LOGO_SIZE)
      .attr('x', (d: any) => d.x - LOGO_SIZE / 2)
      .attr('y', (d: any) => d.y - LOGO_SIZE / 2);
    paths.style('stroke-width', getPathWidth);
    clickablePaths.style('stroke-width', (d: any) =>
      d.flow === 0 ? 0 : Math.max(MIN_PATH_CLICK_WIDTH, getPathWidth(d)),
    );
  }

  function ticked() {
    const LOGO_SIZE =
      Math.sqrt((NODE_AREAS_SHARE.MIN * availableArea) / Math.PI) *
      2 *
      Math.cos(Math.PI / 4) *
      0.8;
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
      .attr('dx', (d: any) => d.x - d.chain.split(' ')[0].length * 4.7)
      .attr('dy', (d: any) => (d.y as number) + 5);
    images
      .attr('x', (d: any) => d.x - LOGO_SIZE / 2)
      .attr('y', (d: any) => d.y - LOGO_SIZE / 2);
    blurredImages
      .attr('x', (d: any) => d.x - LOGO_SIZE / 2)
      .attr('y', (d: any) => d.y - LOGO_SIZE / 2);
    const getPath = (d: any) => {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy);
      const source = dx > 0 ? d.source : d.target;
      const target = dx > 0 ? d.target : d.source;
      const reverse = d.reverse === true;
      const x1 = source.x as number;
      const y1 = source.y as number;
      const x2 = target.x as number;
      const y2 = target.y as number;
      return `M${x1},${y1}A${dr},${dr} 0 0,${reverse ? 0 : 1} ${x2},${y2}`;
    };
    paths
      .attr('d', getPath)
      .classed('dash', (d: any) => d.target.x - d.source.x > 0)
      .classed('dash-reverse', (d: any) => d.target.x - d.source.x <= 0);
    clickablePaths.attr('d', getPath);
  }

  function findSelectedChain(path: string): IFlowBridgesGraphNode | undefined {
    return data.nodes.find(
      (node) => node.chain === path.split('/')[2]?.split('-').join(' '),
    );
  }

  function findSelectedBridge(
    path: string,
  ): IFlowBridgesGraphBridgeLink | undefined {
    return data.links.find(
      (link) => link.bridge === path.split('/')[2]?.split('-').join(' '),
    );
  }

  function updateSelected(path: string) {
    if (path === '/') {
      unselectAll();
      setMode(GRAPH_MODES.FLOWS);
    } else if (path.includes('bridges')) {
      setMode(GRAPH_MODES.BRIDGES);
      highlightBridge(findSelectedBridge(path));
    } else if (path.includes('chain')) {
      setMode(GRAPH_MODES.FLOWS);
      highlightChain(findSelectedChain(path));
    }
  }

  function unselectAll() {
    tvlCircles
      .classed('circle-selected', false)
      .classed('circle-hovered', false);
    paths
      .classed('path-selected', false)
      .classed('path-hovered', false)
      .style('filter', 'none');
    blurredImages
      .classed('blurred-image-selected', false)
      .classed('blurred-image-hovered', false);
  }

  return { updateSelected };
}
