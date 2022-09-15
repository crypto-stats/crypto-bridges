import { FOOTER_HEIGHT, HEADER_HEIGHT, PANEL_WIDTH } from './constants';
import { BridgeCategory, IAudit, IData } from './data/types';

export interface IBridgeLink {
  source: string;
  target: string;
  bridge: string;
  logo: string;
  website?: string;
  flow: number;
  type: BridgeCategory | null;
  audits: IAudit[] | null;
  bridgeIndex: number;
}

export interface IFlowLink {
  source: string;
  target: string;
  flow: number;
  reverse: boolean;
}

export interface IChainNode {
  id: string;
  name: string;
  logo: string;
  tvl: number;
  in: number;
}

export interface IGraphData {
  nodes: IChainNode[];
  links: (IBridgeLink | IFlowLink)[];
}

export function convertDataForGraph(data: IData): IGraphData {
  const graphData: IGraphData = { nodes: [], links: [] };
  const aggregatedFlows: IFlowLink[] = [];
  data.flows.forEach((flow) => {
    if (flow.metadata.name === undefined) {
      console.error(
        'Data type error: no bridge name given for flow entry: ' + flow.id,
      );
      flow.metadata.name = 'Undefined';
    }
    const chainAIndex = graphData.nodes.findIndex(
      (node) => node.id === flow.metadata.chainA,
    );
    if (chainAIndex === -1) {
      const chain = data.chains.find(
        (chain) => chain.id === flow.metadata.chainA,
      );
      if (chain === undefined) {
        console.error(
          'Data error: no matching chain in data for ' + flow.metadata.chainA,
        );
        return;
      }
      graphData.nodes.push({
        id: chain.id,
        name: chain.name || chain.id.replaceAll('-', ' '),
        logo: chain.logo,
        tvl: flow.results.currentValueBridgedAToB || 0,
        in: flow.results.currentValueBridgedBToA || 0,
      });
    } else {
      graphData.nodes[chainAIndex].tvl +=
        flow.results.currentValueBridgedAToB || 0;
      graphData.nodes[chainAIndex].in +=
        flow.results.currentValueBridgedBToA || 0;
    }
    const chainBIndex = graphData.nodes.findIndex(
      (node) => node.id === flow.metadata.chainB,
    );
    if (chainBIndex === -1) {
      const chain = data.chains.find(
        (chain) => chain.id === flow.metadata.chainB,
      );
      if (chain === undefined) {
        console.error(
          'Data error: no matching chain in data for ' + flow.metadata.chainB,
        );
        return;
      }
      graphData.nodes.push({
        id: chain.id,
        name: chain.name || chain.id.replaceAll('-', ' '),
        logo: chain.logo,
        tvl: flow.results.currentValueBridgedBToA || 0,
        in: flow.results.currentValueBridgedAToB || 0,
      });
    } else {
      graphData.nodes[chainBIndex].tvl +=
        flow.results.currentValueBridgedBToA || 0;
      graphData.nodes[chainBIndex].in +=
        flow.results.currentValueBridgedAToB || 0;
    }

    const bridge = data.bridges.find((bridge) => bridge.id === flow.bundle);
    if (bridge === undefined) {
      console.error(
        'Data error: no matching bridge in data for ' + flow.bundle,
      );
      return;
    }
    if (typeof bridge.metadata.category !== 'string') {
      console.error(
        'Data type error: bridge category not defined for flow: ' + bridge.id,
      );
      bridge.metadata.category = 'unknown';
    }
    graphData.links.push({
      source: flow.metadata.chainA,
      target: flow.metadata.chainB,
      website: bridge.metadata.website,
      audits: bridge.metadata.audits ?? null,
      type: bridge.metadata.category,
      flow: flow.results.currentValueBridgedAToB || 0,
      bridge: flow.bundle,
      logo: bridge.metadata.icon,
      bridgeIndex: graphData.links.filter(
        (link) =>
          (link.source === flow.metadata.chainA.toLowerCase() &&
            link.target === flow.metadata.chainB.toLowerCase()) ||
          (link.target === flow.metadata.chainA.toLowerCase() &&
            link.source === flow.metadata.chainB.toLowerCase()),
      ).length,
    });
    graphData.links.push({
      source: flow.metadata.chainB,
      target: flow.metadata.chainA,
      website: bridge.metadata.website,
      audits: bridge.metadata.audits ?? null,
      type: bridge.metadata.category,
      flow: flow.results.currentValueBridgedBToA || 0,
      bridge: flow.bundle,
      logo: bridge.metadata.icon,
      bridgeIndex: graphData.links.filter(
        (link) =>
          (link.source === flow.metadata.chainB.toLowerCase() &&
            link.target === flow.metadata.chainA.toLowerCase()) ||
          (link.target === flow.metadata.chainB.toLowerCase() &&
            link.source === flow.metadata.chainA.toLowerCase()),
      ).length,
    });

    const flowToIndex = aggregatedFlows.findIndex(
      (f) =>
        f.source === flow.metadata.chainA && f.target === flow.metadata.chainB,
    );
    if (flowToIndex === -1) {
      aggregatedFlows.push({
        source: flow.metadata.chainA.toLowerCase(),
        target: flow.metadata.chainB.toLowerCase(),
        flow: flow.results.currentValueBridgedAToB || 0,
        reverse: false,
      });
    } else {
      aggregatedFlows[flowToIndex].flow +=
        flow.results.currentValueBridgedAToB || 0;
    }

    const flowFrom = aggregatedFlows.findIndex(
      (f) =>
        f.target === flow.metadata.chainA && f.source === flow.metadata.chainB,
    );
    if (flowFrom === -1) {
      aggregatedFlows.push({
        target: flow.metadata.chainA.toLowerCase(),
        source: flow.metadata.chainB.toLowerCase(),
        flow: flow.results.currentValueBridgedBToA || 0,
        reverse: true,
      });
    } else {
      aggregatedFlows[flowFrom].flow +=
        flow.results.currentValueBridgedBToA || 0;
    }
  });
  graphData.links.push(...aggregatedFlows);
  return graphData;
}

export function needsLandscape(): boolean {
  if (window === undefined) return false;
  return window.innerWidth - PANEL_WIDTH > PANEL_WIDTH;
}

interface IDimensions {
  width: number;
  height: number;
}

export function getDiagramDimensions(): IDimensions {
  const isLandscape = needsLandscape();
  const isMobile = devicePixelRatio > 1.5;
  const usedWidth = isMobile ? screen.availWidth : innerWidth;
  const usedHeight = isMobile ? screen.availHeight : innerHeight;
  return {
    width: isLandscape ? usedWidth - PANEL_WIDTH : usedWidth,
    height: isLandscape
      ? usedHeight - HEADER_HEIGHT - FOOTER_HEIGHT
      : usedWidth * 0.6,
  };
}

export function addLeadingZero(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

// Logarithmic constants:
// node radius distribution follows A * log(B * value)
// (https://math.stackexchange.com/questions/716152/graphing-given-two-points-on-a-graph-find-the-logarithmic-function-that-passes)
export function findLogParameters(
  minInput: number,
  maxInput: number,
  minOutput: number,
  maxOutput: number,
): [number, number] {
  const A = (minOutput - maxOutput) / Math.log(minInput / maxInput);
  const B = Math.exp(
    (maxOutput * Math.log(minInput) - minOutput * Math.log(maxInput)) /
      (minOutput - maxOutput),
  );
  return [A, B];
}

// Linear constants:
// node radius distribution follows (A * value + B)
export function findLinearParameters(
  minInput: number,
  maxInput: number,
  minOutput: number,
  maxOutput: number,
): [number, number] {
  const A = (maxOutput - minOutput) / (maxInput - minInput);
  const B = maxOutput - maxInput * A;
  return [A, B];
}

export function format(x: number): string {
  return x.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}
