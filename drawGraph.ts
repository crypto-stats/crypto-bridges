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
  SankeyExtraProperties,
  SankeyGraph,
  sankeyLinkHorizontal,
  SankeyLinkMinimal,
  SankeyNodeMinimal,
} from 'd3-sankey';
import type { RefObject } from 'react';
import {
  TooltipBridgeArg,
  TooltipChainArg,
  TooltipFlowArg,
} from './components/NetworkDiagram';
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
  IBridgeLink,
  IChainNode,
  IFlowLink,
  IGraphData,
} from './utils';

let guiCreated = false;

export const PADDING = 30;

const MIN_PATH_CLICK_WIDTH = 40;

const PATHS_GLOW = false;

export enum GRAPH_MODES {
  FLOWS,
  BRIDGES,
  SANKEY,
}

export interface INetworkGraph {
  updateSelected: (path: string) => void;
  showImports: (imports: boolean) => void;
  showsImports: () => boolean;
  importBoundaries: () => [number, number];
  updateImportBoundaries: (boundaries: [number, number]) => void;
  exportBoundaries: () => [number, number];
  updateExportBoundaries: (boundaries: [number, number]) => void;
}

enum DISTRIBUTION {
  LOGARITHMIC,
  LINEAR,
}

export function drawGraph(
  svgRef: RefObject<SVGSVGElement>,
  data: IGraphData,
  navigateTo: (path: string) => void,
  showChainTooltip: (coords: TooltipChainArg) => void,
  showFlowTooltip: (coords: TooltipFlowArg) => void,
  showBridgeTooltip: (coords: TooltipBridgeArg) => void,
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
  let [kAPS, kBPS] = getSankeyPathWidthParameters(1, 100);

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
  let isImport = true;
  const chainImportBoundaries: [number, number] = [0, 0];
  const chainExportBoundaries: [number, number] = [0, 0];
  let LOGO_SIZE = 5;
  let bridgeSelected: IBridgeLink | undefined;
  let sankeyNodesStacked = 0;

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
    .style('cursor', (path: IBridgeLink | IFlowLink) =>
      (path as IBridgeLink & IFlowLink).type !== undefined
        ? 'pointer'
        : 'normal',
    )
    .style('stroke', 'rgba(255,255,255,0)')
    .style('stroke-opacity', 0)
    .on('mouseover', onMouseOverPath)
    .on('mouseout', onMouseOut)
    .on('click', function (e: MouseEvent, path: IBridgeLink | IFlowLink) {
      e.preventDefault();
      let link;
      if ((path as IBridgeLink & IFlowLink).type !== undefined) {
        link = getLinkFromBridgePath(path as IBridgeLink);
        navigateTo(link);
      }
    });

  const flowArray = data.links.map((link) => link.flow).filter((v) => v > 0);
  const minFlow = Math.min.apply(null, flowArray);
  const maxFlow = Math.max.apply(null, flowArray);
  const [kAFlows, kBFlows] = findLogParameters(minFlow, maxFlow, 0, 1);
  const paths = svg
    .selectAll('line')
    .data(data.links)
    .enter()
    .append('path')
    .style('fill', 'none')
    .style('fill-opacity', 0)
    .style('stroke-width', getPathWidth)
    .classed('highlight', true)
    .classed('noPointer', true)
    .each(function (d: any) {
      const image = kAFlows * Math.log(kBFlows * d.flow);
      let className = 'path-default';
      if (image > maxFlow - 1) {
        className = 'path-default-100';
      } else if (image > 0.9) {
        className = 'path-default-90';
      } else if (image > 0.8) {
        className = 'path-default-80';
      } else if (image > 0.7) {
        className = 'path-default-70';
      } else if (image > 0.6) {
        className = 'path-default-60';
      } else if (image > 0.5) {
        className = 'path-default-50';
      } else if (image > 0.4) {
        className = 'path-default-40';
      } else if (image > 0.3) {
        className = 'path-default-30';
      } else if (image > 0.2) {
        className = 'path-default-20';
      } else if (image > 0.1) {
        className = 'path-default-10';
      } else if (image < minFlow + 1) {
        className = 'path-default-0';
      }
      select(this).classed(className, true);
    });
  /* .each(function () {
      const circle = document.createElement('circle');
      circle.className = 'arrow';
      (this as any).parentNode.insertBefore(circle, (this as any).nextSibling!);
    }); */

  const circleGroups = svg
    .selectAll('circle')
    .data(data.nodes)
    .enter()
    .append('g')
    .classed('highlight', true);

  const tvlCircles = circleGroups
    .append('circle')
    .attr('r', getTvlRadius)
    .style('fill', '#412957')
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

  function highlightChain(node?: IChainNode) {
    if (node === undefined) {
      return unselectAll();
    }
    const targetNodesArray = data.nodes
      .filter((item) => {
        for (const link of data.links) {
          if (
            link.flow !== undefined &&
            link.flow > 0 &&
            (link as any).bridge === undefined &&
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
            (link as any).bridge === undefined &&
            (link.source as any).id === item.id &&
            (link.target as any).id === node.id &&
            (link as IBridgeLink).type === undefined
          ) {
            return true;
          }
        }
        return false;
      })
      .map((item) => item.id);

    const sourceOrTarget = isImport ? sourceNodesArray : targetNodesArray;
    const nodesArray = data.nodes.filter((item) =>
      sourceOrTarget.includes(item.id),
    );
    nodesArray.sort((nodeA, nodeB) => {
      const linkA = data.links.find((link) => {
        if (isImport) {
          return (
            (link.source as any).id === nodeA.id &&
            (link.target as any).id === node.id &&
            (link as IBridgeLink).type === undefined
          );
        } else {
          return (
            (link.target as any).id === nodeA.id &&
            (link.source as any).id === node.id &&
            (link as IBridgeLink).type === undefined
          );
        }
      });
      const linkB = data.links.find((link) => {
        if (isImport) {
          return (
            (link.source as any).id === nodeB.id &&
            (link.target as any).id === node.id &&
            (link as IBridgeLink).type === undefined
          );
        } else {
          return (
            (link.target as any).id === nodeB.id &&
            (link.source as any).id === node.id &&
            (link as IBridgeLink).type === undefined
          );
        }
      });
      return (linkB?.flow || 0) - (linkA?.flow || 0);
    });
    nodesArray.push(node);
    const linksArray = data.links
      .filter(
        (item: any) =>
          item.bridge === undefined &&
          item.flow !== undefined &&
          item.flow > 0 &&
          (isImport ? item.target.id : item.source.id) === node.id &&
          sourceOrTarget.indexOf(
            (isImport ? item.source.id : item.target.id) as string,
          ) > -1,
      )
      .map((flow: any) => ({
        value: flow.flow as number,
        source: nodesArray.findIndex((item) => item.id === flow.source.id),
        target: nodesArray.findIndex((item) => item.id === flow.target.id),
      }))
      .sort((a, b) => a.value - b.value);
    if (linksArray.length > 0) {
      [kAPS, kBPS] = getSankeyPathWidthParameters(
        linksArray[0].value,
        linksArray[linksArray.length - 1].value,
      );
    }
    sankeyInput = {
      nodes: nodesArray,
      links: linksArray,
    };
    resetSankey(width, height);
    paths.classed('transparent', true);
    circleGroups.classed(
      'transparent',
      (c: any) =>
        sourceOrTarget.indexOf(c.id as string) === -1 && node.id !== c.id,
    );
    linksContainer.classed('transparent', false).classed('path-hidden', false);
    nodesContainer.classed('transparent', false).classed('path-hidden', false);
  }

  function highlightBridge(link?: IBridgeLink) {
    bridgeSelected = link;
    if (link === undefined) {
      return unselectAll();
    }
    paths
      .classed(
        'path-selected',
        (d: any) => d.bridge === link.bridge && d.type !== undefined,
      )
      .classed(
        'transparent',
        (d: any) =>
          bridgeSelected !== undefined && d.bridge !== bridgeSelected.bridge,
      )
      .classed(
        'path-hidden',
        (d: any) =>
          bridgeSelected !== undefined && d.bridge !== bridgeSelected.bridge,
      )
      .style('filter', (d: any) =>
        PATHS_GLOW && d.bridge === link.bridge && d.bridge !== undefined
          ? `url(#${GLOW_ID})`
          : 'none',
      );
    tvlCircles.classed('circle-selected', false);
    const chainsServed: string[] = [];
    data.links
      .filter((path) => (path as IBridgeLink).bridge === link.bridge)
      .forEach((path) => {
        const source = (path.source as any).id as string;
        chainsServed.includes(source) ? true : chainsServed.push(source);
        const target = (path.target as any).id as string;
        chainsServed.includes(target) ? true : chainsServed.push(target);
      });
    circleGroups
      .classed(
        'transparent',
        (d: any) => !chainsServed.includes(d.id as string),
      )
      .classed(
        'path-hidden',
        (d: any) => !chainsServed.includes(d.id as string),
      );
    blurredImages.classed('blurred-image-selected', false);
    clickablePaths.classed(
      'path-hidden',
      (d: any) =>
        bridgeSelected !== undefined && d.bridge !== bridgeSelected.bridge,
    );
    linksContainer.classed('transparent', true).classed('path-hidden', true);
    nodesContainer.classed('transparent', true).classed('path-hidden', true);
  }

  function resetSankey(width: number, height: number) {
    const biggestTvlNode = data.nodes.sort((a, b) => b.tvl - a.tvl)[0];
    const SANKEY_PADDING = PADDING + getTvlRadius(biggestTvlNode);
    sankeyLayout = sankey()
      .nodePadding(100)
      .extent([
        [SANKEY_PADDING, SANKEY_PADDING],
        [width - SANKEY_PADDING, height - SANKEY_PADDING],
      ])
      .nodeSort(
        null as any as (
          a: SankeyNodeMinimal<any, any>,
          b: SankeyNodeMinimal<any, any>,
        ) => number,
      );
    const { links, nodes } = sankeyLayout(sankeyInput);
    sankeyNodesStacked = nodes.length - 1;
    updateSankeyLinks(links);
    //updateSankeyNodes(nodes);
    const LOGO_SIZE =
      Math.sqrt((NODE_AREAS_SHARE.MIN * availableArea) / Math.PI) *
      2 *
      Math.cos(Math.PI / 4) *
      0.8;
    const circleDiameter =
      Math.sqrt((NODE_AREAS_SHARE.SANKEY * availableArea) / Math.PI) * 2;
    const stagger = sankeyNodesStacked * circleDiameter > height - PADDING * 2;
    tvlCircles
      .attr('cx', (d: any) => {
        return moveCircleToSankeyNodeX(d, stagger ? circleDiameter : undefined);
      })
      .attr('cy', moveCircleToSankeyNodeY);
    images
      .attr('x', (d: any) => {
        return (
          moveCircleToSankeyNodeX(d, stagger ? circleDiameter : undefined) -
          LOGO_SIZE / 2
        );
      })
      .attr('y', (d: any) => {
        return moveCircleToSankeyNodeY(d) - LOGO_SIZE / 2;
      });
    blurredImages
      .attr('x', (d: any) => {
        return (
          moveCircleToSankeyNodeX(d, stagger ? circleDiameter : undefined) -
          LOGO_SIZE / 2
        );
      })
      .attr('y', (d: any) => {
        return moveCircleToSankeyNodeY(d) - LOGO_SIZE / 2;
      });
  }

  function computeCustomSankeyPath(d: any) {
    const defaultPath = computeSankeyLinkPath(d);
    if (defaultPath === null) return '';
    const targetHeight = `${height / 2}`;
    const bits = defaultPath.split(',');
    if (isImport) {
      bits[4] = targetHeight;
      bits[6] = targetHeight;
    } else {
      const bit1 = bits[1].split('C');
      bit1[0] = targetHeight;
      bits[1] = bit1.join('C');
      bits[2] = targetHeight;
    }
    return bits.join(',');
  }

  function updateSankeyLinks(
    data: SankeyLinkMinimal<SankeyExtraProperties, SankeyExtraProperties>[],
  ) {
    const links = linksContainer
      .selectAll('.sankeyLink')
      .data(data, (d: any) => `${d.source as number}${d.target as number}`);
    links.exit().remove();
    links
      .attr('d', computeCustomSankeyPath)
      .style('stroke-width', getSankeyPathWidth)
      .style('filter', function (d: any) {
        return PATHS_GLOW && d.y0 !== d.y1 ? `url(#${GLOW_ID})` : 'none';
      });
    const flowArray = data.map((link) => link.value);
    const minS = Math.min.apply(null, flowArray);
    const maxS = Math.max.apply(null, flowArray);
    const [kAS, kBS] = findLogParameters(minS, maxS, 0, 1);
    links
      .enter()
      .append('path')
      .attr('class', 'sankeyLink')
      .classed('highlight', true)
      .classed('noPointer', true)
      .style('fill', 'none')
      .attr('d', computeCustomSankeyPath)
      .style('stroke-width', getSankeyPathWidth)
      .style('filter', function (d: any) {
        return PATHS_GLOW && d.y0 !== d.y1 ? `url(#${GLOW_ID})` : 'none';
      })
      .each(function (d: any) {
        const image = kAS * Math.log(kBS * d.value);
        let className = 'path-default';
        if (image > maxS - 1) {
          className = 'path-default-100';
        } else if (image > 0.9) {
          className = 'path-default-90';
        } else if (image > 0.8) {
          className = 'path-default-80';
        } else if (image > 0.7) {
          className = 'path-default-70';
        } else if (image > 0.6) {
          className = 'path-default-60';
        } else if (image > 0.5) {
          className = 'path-default-50';
        } else if (image > 0.4) {
          className = 'path-default-40';
        } else if (image > 0.3) {
          className = 'path-default-30';
        } else if (image > 0.2) {
          className = 'path-default-20';
        } else if (image > 0.1) {
          className = 'path-default-10';
        } else if (image < minS + 1) {
          className = 'path-default-0';
        }
        if (d.source.id === undefined || d.target.id === undefined) {
          className = 'path-default';
        }
        select(this).classed(className, true);
      });
    const clickableLinks = linksContainer
      .selectAll('.sankeyLinkClickable')
      .data(data, (d: any) => `${d.source as number}${d.target as number}`);
    clickableLinks.exit().remove();
    clickableLinks
      .attr('d', computeCustomSankeyPath)
      .style('stroke-width', (d: any) =>
        Math.max(MIN_PATH_CLICK_WIDTH, getPathWidth(d)),
      )
      .style('stroke', 'rgba(255,255,255,0)')
      .on('mouseover', onMouseOverSankeyFlow)
      .on('mouseout', onMouseOut);
    clickableLinks
      .enter()
      .append('path')
      .attr('class', 'sankeyLinkClickable')
      .style('fill', 'none')
      .style('stroke', 'rgba(255,255,255,0)')
      .classed('transparent', true)
      .on('mouseover', onMouseOverSankeyFlow)
      .on('mouseout', onMouseOut)
      .attr('d', computeCustomSankeyPath)
      .style('stroke-width', (d: any) =>
        Math.max(MIN_PATH_CLICK_WIDTH, getPathWidth(d)),
      );
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

  function moveCircleToSankeyNodeX(d: any, circleDiameter?: number) {
    const node = sankeyInput.nodes.find((node) => node.id === d.id);
    if (node === undefined) return 0;
    const arrayCheck = isImport
      ? sankeyInput.links.map((link) => (link.source as any).id as string)
      : [(sankeyInput.links[0]?.source as any)?.id as string];
    const isStartNode = arrayCheck.includes(node.id as string);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let value = isStartNode ? node.x1! : node.x0!;
    if (
      circleDiameter !== undefined &&
      ((isImport && isStartNode) || (!isImport && !isStartNode))
    ) {
      const staggering = (height - PADDING * 2) / sankeyNodesStacked;
      const index = Math.floor((d.y0 - PADDING) / staggering);
      value += (Math.pow(-1, index) * circleDiameter * 0.8) / 2;
    }
    return isNaN(value) ? -90 : value;
  }

  function moveCircleToSankeyNodeY(d: any) {
    const node = sankeyInput.nodes.find((node) => node.id === d.id);
    if (node === undefined) return 0;
    const arrayCheck = isImport
      ? sankeyInput.links.map((link) => (link.source as any).id as string)
      : [(sankeyInput.links[0]?.source as any)?.id as string];
    const isStartNode = arrayCheck.includes(node.id as string);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const defaultHeight = (node.y1! - node.y0!) / 2 + node.y0!;
    if (isImport) {
      return isStartNode ? defaultHeight : height / 2;
    } else {
      return isStartNode ? height / 2 : defaultHeight;
    }
  }

  function onMouseOut() {
    linksContainer
      .selectAll('.sankeyLink')
      .classed('path-hovered', false)
      .classed('path-unhovered', false);
    tvlCircles.classed('circle-hovered', false).style('filter', function () {
      return select(this).classed('circle-selected')
        ? `url(#${GLOW_ID})`
        : 'none';
    });
    paths
      .classed('path-hovered', false)
      .classed('path-unhovered', false)
      .style('filter', function () {
        return PATHS_GLOW && select(this).classed('path-selected')
          ? `url(#${GLOW_ID})`
          : 'none';
      });
    blurredImages.classed('blurred-image-hovered', false);
    showBridgeTooltip(false);
    showChainTooltip(false);
    showFlowTooltip(false);
  }

  function onMouseOverPath(e: MouseEvent, path: IBridgeLink | IFlowLink) {
    if ((path as IBridgeLink & IFlowLink).type !== undefined) {
      onMouseOverBridge(path as IBridgeLink);
    } else {
      onMouseOverFlow(path as IFlowLink);
    }
  }

  function onMouseOverSankeyFlow(e: MouseEvent, path: any) {
    const source = path.source as {
      id: string;
      x: number;
      y: number;
      logo: string;
    };
    const target = path.target as {
      id: string;
      x: number;
      y: number;
      logo: string;
    };
    const links = linksContainer.selectAll('.sankeyLink');
    links
      .classed(
        'path-hovered',
        (d: any) =>
          (d.source.id === source.id && d.target.id === target.id) ||
          (d.target.id === source.id && d.source.id === target.id),
      )
      .classed(
        'path-unhovered',
        (d: any) =>
          !(
            (d.source.id === source.id && d.target.id === target.id) ||
            (d.target.id === source.id && d.source.id === target.id)
          ),
      )
      .style('filter', function (d: any) {
        return PATHS_GLOW &&
          d.y0 !== d.y1 &&
          ((d.source.id === source.id && d.target.id === target.id) ||
            (d.target.id === source.id && d.source.id === target.id) ||
            select(this).classed('path-selected'))
          ? `url(#${GLOW_ID})`
          : 'none';
      });
    const targetX = computeCircleX(target);
    const sourceX = computeCircleX(source);
    const targetY = computeCircleY(target);
    const sourceY = computeCircleY(source);
    showFlowTooltip({
      x: (targetX - sourceX) / 2 + sourceX,
      y: (targetY - sourceY) / 2 + sourceY,
      value12: path.value,
      chain1: source.id,
      chain2: target.id,
      logo1: source.logo,
      logo2: target.logo,
    });
    tvlCircles
      .classed('circle-hovered', (c: any) =>
        [source.id, target.id].includes(c.id as string),
      )
      .style('filter', (c: any) =>
        [source.id, target.id].includes(c.id as string)
          ? `url(#${GLOW_ID})`
          : 'none',
      );
    blurredImages.classed('blurred-image-hovered', (c: any) =>
      [source.id, target.id].includes(c.id as string),
    );
  }

  function onMouseOverFlow(path: IFlowLink) {
    const source = path.source as any as {
      id: string;
      x: number;
      y: number;
      logo: string;
    };
    const target = path.target as any as {
      id: string;
      x: number;
      y: number;
      logo: string;
    };
    let value21 = undefined;
    paths.each((d: any) => {
      if (
        d.source.id === target.id &&
        d.target.id === source.id &&
        d.flow > 0 &&
        d.bridge === undefined
      ) {
        value21 = d.flow;
      }
    });
    if (mode === GRAPH_MODES.FLOWS) {
      showFlowTooltip({
        x: (target.x - source.x) / 2 + source.x,
        y: (target.y - source.y) / 2 + source.y,
        value12: path.flow,
        value21,
        chain1: source.id,
        chain2: target.id,
        logo1: source.logo,
        logo2: target.logo,
      });
    }
    paths
      .classed(
        'path-hovered',
        (d: any) =>
          (d.source.id === source.id && d.target.id === target.id) ||
          (d.target.id === source.id && d.source.id === target.id),
      )
      .classed(
        'path-unhovered',
        (d: any) =>
          !(
            (d.source.id === source.id && d.target.id === target.id) ||
            (d.target.id === source.id && d.source.id === target.id)
          ),
      )
      .style('filter', function (d: any) {
        return PATHS_GLOW &&
          ((d.source.id === source.id && d.target.id === target.id) ||
            (d.target.id === source.id && d.source.id === target.id) ||
            select(this).classed('path-selected'))
          ? `url(#${GLOW_ID})`
          : 'none';
      });
    tvlCircles
      .classed('circle-hovered', function (c: any) {
        return source.id === c.id || target.id === c.id;
      })
      .style('filter', function (d: any) {
        return source.id === d.id ||
          target.id === d.id ||
          select(this).classed('circle-selected')
          ? `url(#${GLOW_ID})`
          : 'none';
      });
    blurredImages.classed(
      'blurred-image-hovered',
      (c: any) => source.id === c.id || target.id === c.id,
    );
  }

  function onMouseOverBridge(bridge: IBridgeLink) {
    const name = bridge.bridge;
    const source = bridge.source as any as { id: string; x: number; y: number };
    const target = bridge.target as any as { id: string; x: number; y: number };
    mode === GRAPH_MODES.BRIDGES &&
      showBridgeTooltip({
        x: (target.x - source.x) / 2 + source.x,
        y: (target.y - source.y) / 2 + source.y,
        type: bridge.type,
        logo: bridge.logo,
        value: bridge.flow,
        name: bridge.bridge,
      });
    paths
      .classed('path-hovered', (d: any) => d.bridge === name)
      .classed('path-unhovered', (d: any) => d.bridge !== name)
      .style('filter', function (d: any) {
        return PATHS_GLOW &&
          (d.bridge === name || select(this).classed('path-selected'))
          ? `url(#${GLOW_ID})`
          : 'none';
      });
  }

  function onMouseOverNode(e: MouseEvent, node: IChainNode) {
    showChainTooltip({
      x:
        mode === GRAPH_MODES.SANKEY
          ? moveCircleToSankeyNodeX(node)
          : (node as any).x,
      y:
        mode === GRAPH_MODES.SANKEY
          ? moveCircleToSankeyNodeY(node)
          : (node as any).y,
      chain: node.name,
      logo: node.logo,
      exports: node.tvl,
      imports: node.in,
    });
    const connectedNodeNames: string[] = [];
    if (mode !== GRAPH_MODES.SANKEY) {
      paths
        .classed('path-hovered', (d: any) => {
          if (d.source.id === node.id || d.target.id === node.id) {
            connectedNodeNames.push(d.source.id as string);
            connectedNodeNames.push(d.target.id as string);
            return true;
          }
          return false;
        })
        .classed(
          'path-unhovered',
          (d: any) => !(d.source.id === node.id || d.target.id === node.id),
        )
        .style('filter', function (d: any) {
          return PATHS_GLOW &&
            (d.source.id === node.id ||
              d.target.id === node.id ||
              select(this).classed('path-selected'))
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
    } else {
      linksContainer
        .selectAll('.sankeyLink')
        .classed('path-hovered', (d: any) => {
          if (d.source.id === node.id || d.target.id === node.id) {
            connectedNodeNames.push(
              d.source.id as string,
              d.target.id as string,
            );
            return true;
          }
          return false;
        })
        .style('filter', function (d: any) {
          return PATHS_GLOW &&
            d.y0 !== d.y1 &&
            (d.source.id === node.id || d.target.id === node.id)
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
  }

  function setMode(newMode: GRAPH_MODES) {
    mode = newMode;
    paths.classed('transparent', hidePathIfChainsWithinBoundaries);
    clickablePaths.classed('path-hidden', hidePathIfChainsWithinBoundaries);
    circleGroups
      .classed('transparent', false)
      .classed('path-hidden', hideNodeIfWithinBoundaries);
    tvlCircles.attr('r', getTvlRadius);
  }

  function onClick(e: MouseEvent, node: IChainNode) {
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

  function getSankeyPathWidthParameters(
    minFlow: number,
    maxFlow: number,
  ): [number, number] {
    const minNodeArea = NODE_AREAS_SHARE.MIN * availableArea;
    const minNodeRadius = Math.sqrt(minNodeArea / Math.PI);
    switch (distribution) {
      case DISTRIBUTION.LINEAR: {
        return findLinearParameters(
          minFlow,
          maxFlow,
          MIN_PATH_WIDTH,
          minNodeRadius,
        );
      }
      case DISTRIBUTION.LOGARITHMIC: {
        return findLogParameters(
          minFlow,
          maxFlow,
          MIN_PATH_WIDTH,
          minNodeRadius,
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
        const w = kAP * (d.flow ?? d.value) + kBP;
        return w / (width < 500 ? 2 : 1);
      }
      case DISTRIBUTION.LOGARITHMIC: {
        const w = kAP * Math.log(kBP * (d.flow ?? d.value));
        return w / (width < 500 ? 2 : 1);
      }
    }
  }

  function getSankeyPathWidth(d: any): number {
    if (d.value !== undefined && d.value === 0) {
      return 0;
    }
    switch (distribution) {
      case DISTRIBUTION.LINEAR: {
        const w = kAPS * d.value + kBPS;
        return w;
      }
      case DISTRIBUTION.LOGARITHMIC: {
        const w = kAPS * Math.log(kBPS * d.value);
        return w;
      }
    }
  }

  function getTvlRadius(d: any): number {
    if (mode === GRAPH_MODES.SANKEY) {
      return Math.sqrt((NODE_AREAS_SHARE.SANKEY * availableArea) / Math.PI);
    }
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

  function getLinkFromNode(n: IChainNode): string {
    return `/chain/${n.id}`;
  }

  function getLinkFromBridgePath(p: IBridgeLink): string {
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
    LOGO_SIZE =
      Math.sqrt((NODE_AREAS_SHARE.MIN * availableArea) / Math.PI) *
      2 *
      Math.cos(Math.PI / 4) *
      0.8;
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
          .id((d: any) => (d as IChainNode).id)
          .links(data.links),
      )
      .force('center', forceCenter(width / 2, height / 2))
      .on('tick', ticked)
      .on('end', ticked);

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

  function computeCircleX(d: any) {
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
  }

  function computeCircleY(d: any) {
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
  }

  function computeImageX(d: any) {
    if (isImportExport) {
      return moveCircleToSankeyNodeX(d) - LOGO_SIZE / 2;
    }
    return d.x - LOGO_SIZE / 2;
  }

  function computeImageY(d: any) {
    if (isImportExport) {
      return moveCircleToSankeyNodeY(d) - LOGO_SIZE / 2;
    }
    return d.y - LOGO_SIZE / 2;
  }

  function ticked() {
    const circleDiameter =
      Math.sqrt((NODE_AREAS_SHARE.SANKEY * availableArea) / Math.PI) * 2;
    const stagger = sankeyNodesStacked * circleDiameter > height - PADDING * 2;
    const LOGO_SIZE =
      Math.sqrt((NODE_AREAS_SHARE.MIN * availableArea) / Math.PI) *
      2 *
      Math.cos(Math.PI / 4) *
      0.8;
    tvlCircles
      .attr('cx', (d: any) => {
        if (isImportExport) {
          return moveCircleToSankeyNodeX(
            d,
            stagger ? circleDiameter : undefined,
          );
        }
        return computeCircleX(d);
      })
      .attr('cy', computeCircleY);

    images
      .attr('x', (d: any) => {
        if (isImportExport) {
          return (
            moveCircleToSankeyNodeX(d, stagger ? circleDiameter : undefined) -
            LOGO_SIZE / 2
          );
        }
        return computeImageX(d);
      })
      .attr('y', computeImageY);
    blurredImages
      .attr('x', (d: any) => {
        if (isImportExport) {
          return (
            moveCircleToSankeyNodeX(d, stagger ? circleDiameter : undefined) -
            LOGO_SIZE / 2
          );
        }
        return computeImageX(d);
      })
      .attr('y', computeImageY);
    circleGroups.classed('path-hidden', hideNodeIfWithinBoundaries);
    paths
      .attr('d', (d: any) =>
        d.type === undefined ? getFlowPath(d) : getBridgePath(d),
      )
      .classed('path-hidden', hidePathIfChainsWithinBoundaries)
      .classed(
        'transparent',
        (d: any) =>
          (bridgeSelected !== undefined &&
            d.bridge !== bridgeSelected.bridge) ||
          hidePathIfChainsWithinBoundaries(d),
      ); /* .each(function (d: any, i: number) {
        const selection = select(this);
        const p = selection.node();
        if (p === null) return;
        const l = p.getTotalLength();
        const coord = p.getPointAtLength(l * 0.2);
        selection
          .select('.arrow')
          .attr('r', 10)
          .style('fill', '#f00')
          .attr('cx', (e: any) => (e.flow === d.flow ? coord.x : 3))
          .attr('cy', (e: any) => (e.flow === d.flow ? coord.y : 3));
      }); */
    clickablePaths
      .attr('d', (d: any) =>
        d.type !== undefined ? getBridgePath(d) : getFlowPath(d),
      )
      .classed(
        'path-hidden',
        (d: any) =>
          (bridgeSelected !== undefined &&
            d.bridge !== bridgeSelected.bridge) ||
          hidePathIfChainsWithinBoundaries(d),
      );
  }

  function hidePathIfChainsWithinBoundaries(d: any) {
    return (
      mode === GRAPH_MODES.SANKEY ||
      (mode === GRAPH_MODES.FLOWS && d.type !== undefined) ||
      (mode === GRAPH_MODES.BRIDGES && d.type === undefined) ||
      !pathNodesAreWithinBoundaries(d)
    );
  }

  function pathNodesAreWithinBoundaries(d: any) {
    // Use <x+1 and >x-1 because of possible precision issue
    // (Ethereum node disappearing).
    return (
      d.target.in > chainImportBoundaries[0] - 1 &&
      d.target.in < chainImportBoundaries[1] + 1 &&
      d.target.tvl > chainExportBoundaries[0] - 1 &&
      d.target.tvl < chainExportBoundaries[1] + 1 &&
      d.source.in > chainImportBoundaries[0] - 1 &&
      d.source.in < chainImportBoundaries[1] + 1 &&
      d.source.tvl > chainExportBoundaries[0] - 1 &&
      d.source.tvl < chainExportBoundaries[1] + 1
    );
  }

  function hideNodeIfWithinBoundaries(d: any) {
    return (
      mode !== GRAPH_MODES.SANKEY &&
      !(
        d.in >= chainImportBoundaries[0] &&
        d.in <= chainImportBoundaries[1] &&
        d.tvl >= chainExportBoundaries[0] &&
        d.tvl <= chainExportBoundaries[1]
      )
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
    if (d.bridgeIndex === 0) {
      return `M${x1} ${y1} ${x2} ${y2}`;
    }
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

  function findSelectedChain(path: string): IChainNode | undefined {
    return data.nodes.find((node) => node.id === path.split('/')[2]);
  }

  function findSelectedBridge(path: string): IBridgeLink | undefined {
    const result = data.links.find(
      (link) =>
        (link as IBridgeLink).bridge === path.split('/')[2] &&
        (link as IBridgeLink).type !== undefined,
    ) as IBridgeLink | undefined;
    return result;
  }

  function updateSelected(path: string) {
    if (path === '/') {
      isImportExport = false;
      bridgeSelected = undefined;
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
      setMode(GRAPH_MODES.SANKEY);
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
      .classed(
        'transparent',
        (d: any) =>
          (bridgeSelected !== undefined &&
            d.bridge !== bridgeSelected.bridge) ||
          hidePathIfChainsWithinBoundaries(d),
      )
      .style('filter', 'none');
    blurredImages
      .classed('blurred-image-selected', false)
      .classed('blurred-image-hovered', false);
  }

  function showImports(imports: boolean) {
    isImport = imports;
  }

  function showsImports() {
    return isImport;
  }

  function importBoundaries() {
    return chainImportBoundaries;
  }

  function updateImportBoundaries(boundaries: [number, number]) {
    chainImportBoundaries[0] = boundaries[0];
    chainImportBoundaries[1] = boundaries[1];
    ticked();
  }

  function exportBoundaries() {
    return chainExportBoundaries;
  }

  function updateExportBoundaries(boundaries: [number, number]) {
    chainExportBoundaries[0] = boundaries[0];
    chainExportBoundaries[1] = boundaries[1];
    ticked();
  }

  return {
    updateSelected,
    showImports,
    showsImports,
    importBoundaries,
    updateImportBoundaries,
    exportBoundaries,
    updateExportBoundaries,
  };
}
