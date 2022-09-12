import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  select,
  SimulationNodeDatum,
} from 'd3';
import {
  sankey,
  sankeyCenter,
  SankeyExtraProperties,
  SankeyGraph,
  sankeyJustify,
  sankeyLeft,
  sankeyLinkHorizontal,
  SankeyLinkMinimal,
  SankeyNodeMinimal,
  sankeyRight,
} from 'd3-sankey';
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

let guiCreated = false;

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
// surface, so that the proportions are consistent on all possible resize,s.
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

  const settings = {
    'Run Simulation': resize,
    distribution: DISTRIBUTION.LINEAR,
  };

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

  let sankeyInput: SankeyGraph<SankeyExtraProperties, SankeyExtraProperties> = {
    nodes: [{ name: 'btc' }, { name: 'eth' }, { name: 'avax' }],
    links: [
      { source: 0, target: 1, value: 10 },
      { source: 0, target: 2, value: 2 },
    ],
  };
  let sankeyLayout = sankey();
  const linksContainer = svg.append('g');
  const nodesContainer = svg.append('g');
  const computeSankeyLinkPath = sankeyLinkHorizontal();
  let isImportExport = false;

  // initGui();

  async function initGui() {
    if (guiCreated) {
      return;
    }
    guiCreated = true;
    const dat = await import('dat.gui');
    const gui = new dat.GUI();
    const simulation = gui.addFolder('Simulation');
    simulation.open();
    simulation
      .add(settings, 'distribution', {
        linear: DISTRIBUTION.LINEAR,
        logarithmic: DISTRIBUTION.LOGARITHMIC,
      })
      .onChange(resize);
    simulation.add(settings, 'Run Simulation');
  }

  const clickablePaths = svg
    .selectAll('line')
    .data(data.links)
    .enter()
    .append('path')
    .style('fill', 'none')
    .style('fill-opacity', 0)
    .style(
      'cursor',
      (path: IFlowBridgesGraphBridgeLink | IFlowBridgesGraphFlowLink) =>
        (path as IFlowBridgesGraphBridgeLink & IFlowBridgesGraphFlowLink)
          .type !== undefined
          ? 'pointer'
          : 'normal',
    )
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
        if (
          (path as IFlowBridgesGraphBridgeLink & IFlowBridgesGraphFlowLink)
            .type !== undefined
        ) {
          link = getLinkFromBridgePath(path as IFlowBridgesGraphBridgeLink);
          navigateTo(link);
        }
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
    .classed('highlight', true)
    .classed('path-default', true);

  const circleGroups = svg
    .selectAll('circle')
    .data(data.nodes)
    .enter()
    .append('g')
    .classed('highlight', true);

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

  resize();
  updateSelected(window.location.pathname);
  window.addEventListener('resize', resize);

  function highlightChain(node?: IFlowBridgesGraphNode) {
    if (node === undefined) {
      return unselectAll();
    }
    const targetNodesArray = data.nodes
      .filter((item) => {
        for (const link of data.links) {
          if (
            link.flow !== undefined &&
            link.flow > 0 &&
            (link.source as any).id === node.id &&
            (link.target as any).id === item.id
          ) {
            return true;
          }
        }
        return false;
      })
      .map((item) => item.id);
    const sourceNodesArray = data.nodes
      .filter((item) => {
        for (const link of data.links) {
          if (
            link.flow !== undefined &&
            link.flow > 0 &&
            (link.source as any).id === item.id &&
            (link.target as any).id === node.id
          ) {
            return true;
          }
        }
        return false;
      })
      .map((item) => item.id);
    const connectedNodeNames = [...sourceNodesArray, ...targetNodesArray];
    const nodesArray = data.nodes.filter((item) =>
      targetNodesArray.includes(item.id),
    );
    nodesArray.push(node);
    const linksArray = data.links
      .filter(
        (item: any) =>
          item.bridge === undefined &&
          item.flow !== undefined &&
          item.flow > 0 &&
          item.source.id === node.id &&
          targetNodesArray.indexOf(item.target.id as string) > -1,
      )
      .map((flow: any) => ({
        value: flow.flow,
        source: nodesArray.findIndex((item) => item.id === flow.source.id),
        target: nodesArray.findIndex((item) => item.id === flow.target.id),
      }));
    sankeyInput = {
      nodes: nodesArray,
      links: linksArray,
    };
    resetSankey(width, height);
    paths.classed('transparent', true);
    circleGroups.classed(
      'transparent',
      (c: any) =>
        targetNodesArray.indexOf(c.id as string) === -1 && node.id !== c.id,
    );
    tvlCircles.classed(
      'circle-selected',
      (c: any) =>
        targetNodesArray.indexOf(c.id as string) > -1 || node.id === c.id,
    );
    blurredImages.classed(
      'blurred-image-selected',
      (c: any) =>
        targetNodesArray.indexOf(c.id as string) > -1 || node.id === c.id,
    );
    linksContainer.classed('transparent', false).classed('path-hidden', false);
    nodesContainer.classed('transparent', false).classed('path-hidden', false);
  }

  function highlightBridge(link?: IFlowBridgesGraphBridgeLink) {
    if (link === undefined) {
      return unselectAll();
    }
    paths
      .classed(
        'path-selected',
        (d: any) => d.bridge === link.bridge && d.type !== undefined,
      )
      .classed('transparent', (d: any) => d.bridge !== link.bridge)
      .style('filter', (d: any) =>
        d.bridge === link.bridge && d.bridge !== undefined
          ? `url(#${GLOW_ID})`
          : 'none',
      );
    tvlCircles.classed('circle-selected', false);
    const chainsServed: string[] = [];
    data.links
      .filter(
        (path) => (path as IFlowBridgesGraphBridgeLink).bridge === link.bridge,
      )
      .forEach((path) => {
        const source = (path.source as any).name as string;
        chainsServed.includes(source) ? true : chainsServed.push(source);
        const target = (path.target as any).name as string;
        chainsServed.includes(target) ? true : chainsServed.push(target);
      });
    circleGroups.classed(
      'transparent',
      (d: any) => !chainsServed.includes(d.name as string),
    );
    blurredImages.classed('blurred-image-selected', false);
    clickablePaths.classed('path-hidden', (d: any) => d.bridge !== link.bridge);
    linksContainer.classed('transparent', true).classed('path-hidden', true);
    nodesContainer.classed('transparent', true).classed('path-hidden', true);
  }

  function resetSankey(width: number, height: number) {
    const biggestTvlNode = data.nodes.sort((a, b) => b.tvl - a.tvl)[0];
    const SANKEY_PADDING = PADDING + getTvlRadius(biggestTvlNode);
    sankeyLayout = sankey()
      .nodePadding(100)
      .nodeWidth(50)
      .extent([
        [SANKEY_PADDING, SANKEY_PADDING],
        [width - SANKEY_PADDING, height - SANKEY_PADDING],
      ]);
    const { links, nodes } = sankeyLayout(sankeyInput);
    updateSankeyLinks(links);
    updateSankeyNodes(nodes);
    const LOGO_SIZE =
      Math.sqrt((NODE_AREAS_SHARE.MIN * availableArea) / Math.PI) *
      2 *
      Math.cos(Math.PI / 4) *
      0.8;
    tvlCircles
      .attr('cx', moveCircleToSankeyNodeX)
      .attr('cy', moveCircleToSankeyNodeY);
    images
      .attr('x', (d: any) => {
        return moveCircleToSankeyNodeX(d) - LOGO_SIZE / 2;
      })
      .attr('y', (d: any) => {
        return moveCircleToSankeyNodeY(d) - LOGO_SIZE / 2;
      });
    blurredImages
      .attr('x', (d: any) => {
        return moveCircleToSankeyNodeX(d) - LOGO_SIZE / 2;
      })
      .attr('y', (d: any) => {
        return moveCircleToSankeyNodeY(d) - LOGO_SIZE / 2;
      });
  }

  function computeCustomSankeyPath(d: any) {
    'M87.41882961406988,282.43104777743287C480,282.43104777743287,480,82.43104777743318,872.5811703859301,82.43104777743318';
    const defaultPath = computeSankeyLinkPath(d);
    if (defaultPath === null) return '';
    const bits = defaultPath.split(',');
    const bit1 = bits[1].split('C');
    bit1[0] = `${height / 2}`;
    bits[1] = bit1.join('C');
    bits[2] = `${height / 2}`;
    return bits.join(',');
  }

  function updateSankeyLinks(
    data: SankeyLinkMinimal<SankeyExtraProperties, SankeyExtraProperties>[],
  ) {
    const links = linksContainer
      .selectAll('.sankeyLink')
      .data(data, (d: any) => `${d.source as number}${d.target as number}`);
    links.exit().remove();
    links.attr('d', computeCustomSankeyPath);
    links
      .enter()
      .append('path')
      .attr('class', 'sankeyLink')
      .style('stroke-dasharray', MIN_PATH_WIDTH)
      .classed('highlight', true)
      .classed('dash', true)
      .style('fill', 'none')
      .classed('path-selected', true)
      .attr('d', computeCustomSankeyPath)
      .style('stroke-width', getPathWidth)
      .sort((a: any, b: any) => b.dy - a.dy);
  }

  function updateSankeyNodes(
    data: SankeyNodeMinimal<SankeyExtraProperties, SankeyExtraProperties>[],
  ) {
    const nodes = nodesContainer
      .selectAll('.sankeyNode')
      .data(data, (d: any) => d.id as number);
    nodes.exit().remove();
    nodes
      .attr(
        'transform',
        (d: any) => `translate(${d.x0 as number}, ${d.y0 as number})`,
      )
      .attr('height', (d: any) => (d.y1 - d.y0) as number);
    nodes
      .enter()
      .append('rect')
      .attr('class', 'sankeyNode')
      .attr('height', (d: any) => (d.y1 - d.y0) as number)
      .attr('width', sankeyLayout.nodeWidth())
      .attr(
        'transform',
        (d: any) => `translate(${d.x0 as number}, ${d.y0 as number})`,
      )
      .style('fill', '#fff')
      .style('fill-opacity', '0.05');
  }

  function moveCircleToSankeyNodeX(d: any) {
    const node = sankeyInput.nodes.find((node) => node.id === d.id);
    if (node === undefined) return 0;
    const isStartNode = (sankeyInput.links[0]?.source as any)?.id === node.id;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return isStartNode ? node.x1! : node.x0!;
  }

  function moveCircleToSankeyNodeY(d: any) {
    const node = sankeyInput.nodes.find((node) => node.id === d.id);
    if (node === undefined) return 0;
    const isStartNode = (sankeyInput.links[0]?.source as any)?.id === node.id;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return isStartNode ? height / 2 : (node.y1! - node.y0!) / 2 + node.y0!;
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
          (d.source.id === (path.source as any).id &&
            d.target.id === (path.target as any).id) ||
          (d.target.id === (path.source as any).id &&
            d.source.id === (path.target as any).id),
      )
      .style('filter', function (d: any) {
        return (d.source.id === (path.source as any).id &&
          d.target.id === (path.target as any).id) ||
          (d.target.id === (path.source as any).id &&
            d.source.id === (path.target as any).id) ||
          select(this).classed('path-selected')
          ? `url(#${GLOW_ID})`
          : 'none';
      });

    tvlCircles
      .classed('circle-hovered', function (c: any) {
        return (
          (path.source as any).id === c.id || (path.target as any).id === c.id
        );
      })
      .style('filter', function (d: any) {
        return (path.source as any).id === d.id ||
          (path.target as any).id === d.id ||
          select(this).classed('circle-selected')
          ? `url(#${GLOW_ID})`
          : 'none';
      });
    blurredImages.classed(
      'blurred-image-hovered',
      (c: any) =>
        (path.source as any).id === c.id || (path.target as any).id === c.id,
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
        if (d.source.id === node.id || d.target.id === node.id) {
          connectedNodeNames.push(d.source.id as string);
          connectedNodeNames.push(d.target.id as string);
          return true;
        }
        return false;
      })
      .style('filter', function (d: any) {
        return d.source.id === node.id ||
          d.target.id === node.id ||
          select(this).classed('path-selected')
          ? `url(#${GLOW_ID})`
          : 'none';
      });
    tvlCircles
      .classed(
        'circle-hovered',
        (c: any) => connectedNodeNames.indexOf(c.id as string) > -1,
      )
      .style('filter', function (d: any) {
        return connectedNodeNames.indexOf(d.id as string) > -1
          ? `url(#${GLOW_ID})`
          : 'none';
      });
    blurredImages.classed(
      'blurred-image-hovered',
      (c: any) => connectedNodeNames.indexOf(c.id as string) > -1,
    );
  }

  function setMode(newMode: GRAPH_MODES) {
    mode = newMode;
    paths.classed(
      'transparent',
      (d: any) =>
        (mode === GRAPH_MODES.BRIDGES && d.type === undefined) ||
        (mode === GRAPH_MODES.FLOWS && d.type !== undefined),
    );
    clickablePaths.classed(
      'path-hidden',
      (d: any) =>
        (mode === GRAPH_MODES.BRIDGES && d.type === undefined) ||
        (mode === GRAPH_MODES.FLOWS && d.type !== undefined),
    );
    circleGroups.classed('transparent', false);
  }

  function onClick(e: MouseEvent, node: IFlowBridgesGraphNode) {
    e.preventDefault();
    highlightChain(node);
    navigateTo(getLinkFromNode(node));
  }

  function getPathWidthParameters(): [number, number] {
    const maxNodeArea = NODE_AREAS_SHARE.MAX * availableArea;
    const maxNodeRadius = Math.sqrt(maxNodeArea / Math.PI);
    const linksWithFlow = sortedLinks.filter(
      (item) => item.flow !== undefined && item.flow > 0,
    );
    sortedNodes.sort((a, b) => a.tvl - b.tvl);
    const maxPathWidthNodeRadiusRatio =
      linksWithFlow[linksWithFlow.length - 1].flow /
      sortedNodes[sortedNodes.length - 1].tvl;
    const maxPathWidth = maxNodeRadius * maxPathWidthNodeRadiusRatio;
    switch (distribution) {
      case DISTRIBUTION.LINEAR: {
        return findLinearParameters(
          linksWithFlow[0].flow,
          linksWithFlow[linksWithFlow.length - 1].flow,
          MIN_PATH_WIDTH,
          maxPathWidth,
        );
      }
      case DISTRIBUTION.LOGARITHMIC: {
        return findLogParameters(
          linksWithFlow[0].flow,
          linksWithFlow[linksWithFlow.length - 1].flow,
          MIN_PATH_WIDTH,
          maxPathWidth,
        );
      }
    }
  }

  function getPathWidth(d: any): number {
    if (
      (d.flow !== undefined && d.flow === 0) ||
      (d.value !== undefined && d.value === 0)
    ) {
      return 0;
    }
    switch (distribution) {
      case DISTRIBUTION.LINEAR: {
        const width = kAP * (d.flow ?? d.value) + kBP;
        return width;
      }
      case DISTRIBUTION.LOGARITHMIC: {
        const width = kAP * Math.log(kBP * (d.flow ?? d.value));
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
    return `/chain/${n.id}`;
  }

  function getLinkFromBridgePath(p: IFlowBridgesGraphBridgeLink): string {
    const link = `/bridges/${p.bridge.split(' ').join('-')}`;
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
          const force = getTvlRadius(d) / -10000;
          return force * availableArea;
        }),
      )
      .force(
        'link',
        forceLink()
          .id((d: any) => (d as IFlowBridgesGraphNode).id)
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

    resetSankey(width, height);
  }

  function ticked() {
    const LOGO_SIZE =
      Math.sqrt((NODE_AREAS_SHARE.MIN * availableArea) / Math.PI) *
      2 *
      Math.cos(Math.PI / 4) *
      0.8;
    tvlCircles
      .attr('cx', (d: any) => {
        if (isImportExport) {
          return moveCircleToSankeyNodeX(d);
        }
        const radius = getTvlRadius(d);
        const coord = Math.max(
          PADDING + radius,
          Math.min(d.x as number, width - PADDING - radius),
        );
        d.x = coord;
        return coord;
      })
      .attr('cy', (d: any) => {
        if (isImportExport) {
          return moveCircleToSankeyNodeY(d);
        }
        const radius = getTvlRadius(d);
        const coord = Math.max(
          PADDING + radius,
          Math.min(d.y as number, height - PADDING - radius),
        );
        d.y = coord;
        return coord;
      });
    images
      .attr('x', (d: any) => {
        if (isImportExport) {
          return moveCircleToSankeyNodeX(d) - LOGO_SIZE / 2;
        }
        return d.x - LOGO_SIZE / 2;
      })
      .attr('y', (d: any) => {
        if (isImportExport) {
          return moveCircleToSankeyNodeY(d) - LOGO_SIZE / 2;
        }
        return d.y - LOGO_SIZE / 2;
      });
    blurredImages
      .attr('x', (d: any) => {
        if (isImportExport) {
          return moveCircleToSankeyNodeX(d) - LOGO_SIZE / 2;
        }
        return d.x - LOGO_SIZE / 2;
      })
      .attr('y', (d: any) => {
        if (isImportExport) {
          return moveCircleToSankeyNodeY(d) - LOGO_SIZE / 2;
        }
        return d.y - LOGO_SIZE / 2;
      });
    paths
      .attr('d', (d: any) =>
        d.type === undefined ? getFlowPath(d) : getBridgePath(d),
      )
      .classed(
        'dash',
        (d: any) => d.target.x - d.source.x > 0 || d.type !== undefined,
      )
      .classed(
        'dash-reverse',
        (d: any) => d.target.x - d.source.x <= 0 && d.type === undefined,
      );
    clickablePaths.attr('d', (d: any) =>
      d.type !== undefined ? getBridgePath(d) : getFlowPath(d),
    );
  }

  function getFlowPath(d: any) {
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
  }

  function getBeziersPower(d: any, l: number) {
    const COEFF = 1 / 4;
    return Math.floor(((d.bridgeIndex as number) + 2) / 2) * COEFF * l;
  }

  function getBridgePath(d: any) {
    const x1 = d.source.x as number;
    const y1 = d.source.y as number;
    const x2 = d.target.x as number;
    const y2 = d.target.y as number;
    const vector = [x2 - x1, y2 - y1];
    const vectorLength = Math.sqrt(
      vector[0] * vector[0] + vector[1] * vector[1],
    );
    const unitVector = [vector[0] / vectorLength, vector[1] / vectorLength];
    const tangentVector = [unitVector[1], -unitVector[0]];
    const x3 = x1 + tangentVector[0] * getBeziersPower(d, vectorLength);
    const y3 = y1 + tangentVector[1] * getBeziersPower(d, vectorLength);
    const x4 = x2 + tangentVector[0] * getBeziersPower(d, vectorLength);
    const y4 = y2 + tangentVector[1] * getBeziersPower(d, vectorLength);
    return `M${x1} ${y1} C${x3} ${y3}, ${x4} ${y4} ${x2} ${y2}`;
  }

  function findSelectedChain(path: string): IFlowBridgesGraphNode | undefined {
    return data.nodes.find((node) => node.id === path.split('/')[2]);
  }

  function findSelectedBridge(
    path: string,
  ): IFlowBridgesGraphBridgeLink | undefined {
    const result = data.links.find(
      (link) =>
        (link as IFlowBridgesGraphBridgeLink).bridge ===
          path.split('/')[2]?.split('-').join(' ') &&
        (link as IFlowBridgesGraphBridgeLink).type !== undefined,
    ) as IFlowBridgesGraphBridgeLink | undefined;
    return result;
  }

  function updateSelected(path: string) {
    if (path === '/') {
      isImportExport = false;
      resize();
      ticked();
      unselectAll();
      setMode(GRAPH_MODES.FLOWS);
    } else if (path.includes('bridges')) {
      isImportExport = false;
      resize();
      ticked();
      setMode(GRAPH_MODES.BRIDGES);
      highlightBridge(findSelectedBridge(path));
    } else if (path.includes('chain')) {
      isImportExport = true;
      setMode(GRAPH_MODES.FLOWS);
      highlightChain(findSelectedChain(path));
    }
  }

  function unselectAll() {
    linksContainer.classed('transparent', true).classed('path-hidden', true);
    nodesContainer.classed('transparent', true).classed('path-hidden', true);
    circleGroups.classed('transparent', false);
    tvlCircles
      .classed('circle-selected', false)
      .classed('circle-hovered', false);
    paths
      .classed('path-selected', false)
      .classed('path-hovered', false)
      .classed('path-hidden', false)
      .style('filter', 'none');
    blurredImages
      .classed('blurred-image-selected', false)
      .classed('blurred-image-hovered', false);
  }

  return { updateSelected };
}
