import { FOOTER_HEIGHT, HEADER_HEIGHT, PANEL_WIDTH } from './constants';
import { BridgeCategory, IAudit, IDummyData } from './data/types';

export interface IGraphNode {
  name: string;
  value: number;
  imageSrc: string;
  type: 'blockchain' | 'bridge';
  audits: IAudit[] | null;
  category: BridgeCategory | null;
}

export interface IGraphLink {
  source: string;
  target: string;
  tvl: number;
}

export interface IGraphData {
  nodes: IGraphNode[];
  links: IGraphLink[];
}

export interface IFlowBridgesGraphBridgeLink {
  source: string;
  target: string;
  bridge: string;
  logo: string;
  website: string;
  flow: number;
  type: BridgeCategory | null;
  audits: IAudit[] | null;
  bridgeIndex: number;
}

export interface IFlowBridgesGraphFlowLink {
  source: string;
  target: string;
  flow: number;
  reverse: boolean;
}

export interface IFlowBridgesGraphNode {
  chain: string;
  logo: string;
  tvl: number;
  in: number;
}

export interface IFlowBridgesGraphData {
  nodes: IFlowBridgesGraphNode[];
  links: (IFlowBridgesGraphBridgeLink | IFlowBridgesGraphFlowLink)[];
}

interface INode {
  id: string;
  bundle: null;
  results: { currentValueLocked: number };
  metadata: {
    name: string;
    toChain?: string;
    website?: string;
    category: BridgeCategory;
    subtitle: string;
    icon: string | 0;
    fromChain: string;
    audits?: IAudit[];
  };
  errors: { [key: string]: string };
}

export interface ICsApiData {
  success: boolean;
  data: INode[];
}

export function convertDummyDataForGraph(
  data: IDummyData,
): IFlowBridgesGraphData {
  const graphData: IFlowBridgesGraphData = { nodes: [], links: [] };
  const aggregatedFlows: IFlowBridgesGraphFlowLink[] = [];
  data.flows.forEach((flow) => {
    const chainAIndex = graphData.nodes.findIndex(
      (node) => node.chain === flow.a,
    );
    if (chainAIndex === -1) {
      const chain = data.chains.find((chain) => chain.name === flow.a);
      if (chain === undefined) {
        console.error('Data error: no matching chain in data for ' + flow.a);
        return;
      }
      graphData.nodes.push({
        chain: flow.a.toLowerCase(),
        logo: chain.logo,
        tvl: flow.aToB,
        in: flow.bToA,
      });
    } else {
      graphData.nodes[chainAIndex].tvl += flow.aToB;
      graphData.nodes[chainAIndex].in += flow.bToA;
    }
    const chainBIndex = graphData.nodes.findIndex(
      (node) => node.chain === flow.b,
    );
    if (chainBIndex === -1) {
      const chain = data.chains.find((chain) => chain.name === flow.b);
      if (chain === undefined) {
        console.error('Data error: no matching chain in data for ' + flow.b);
        return;
      }
      graphData.nodes.push({
        chain: flow.b.toLowerCase(),
        logo: chain.logo,
        tvl: flow.bToA,
        in: flow.aToB,
      });
    } else {
      graphData.nodes[chainBIndex].tvl += flow.bToA;
      graphData.nodes[chainBIndex].in += flow.aToB;
    }

    const bridge = data.bridges.find((bridge) => bridge.name === flow.bridge);
    if (bridge === undefined) {
      console.error(
        'Data error: no matching bridge in data for ' + flow.bridge,
      );
      return;
    }
    graphData.links.push({
      source: flow.a.toLowerCase(),
      target: flow.b.toLowerCase(),
      website: bridge.website,
      audits: bridge.audits ?? null,
      type: bridge.type,
      flow: flow.aToB,
      bridge: flow.bridge.toLowerCase(),
      logo: bridge.logo,
      bridgeIndex: graphData.links.filter(
        (link) =>
          (link.source === flow.a.toLowerCase() &&
            link.target === flow.b.toLowerCase()) ||
          (link.target === flow.a.toLowerCase() &&
            link.source === flow.b.toLowerCase()),
      ).length,
    });
    graphData.links.push({
      source: flow.b.toLowerCase(),
      target: flow.a.toLowerCase(),
      website: bridge.website,
      audits: bridge.audits ?? null,
      type: bridge.type,
      flow: flow.bToA,
      bridge: flow.bridge.toLowerCase(),
      logo: bridge.logo,
      bridgeIndex: graphData.links.filter(
        (link) =>
          (link.source === flow.b.toLowerCase() &&
            link.target === flow.a.toLowerCase()) ||
          (link.target === flow.b.toLowerCase() &&
            link.source === flow.a.toLowerCase()),
      ).length,
    });

    const flowToIndex = aggregatedFlows.findIndex(
      (f) => f.source === flow.a && f.target === flow.b,
    );
    if (flowToIndex === -1) {
      aggregatedFlows.push({
        source: flow.a.toLowerCase(),
        target: flow.b.toLowerCase(),
        flow: flow.aToB,
        reverse: false,
      });
    } else {
      aggregatedFlows[flowToIndex].flow += flow.aToB;
    }

    const flowFrom = aggregatedFlows.findIndex(
      (f) => f.target === flow.a && f.source === flow.b,
    );
    if (flowFrom === -1) {
      aggregatedFlows.push({
        target: flow.a.toLowerCase(),
        source: flow.b.toLowerCase(),
        flow: flow.bToA,
        reverse: true,
      });
    } else {
      aggregatedFlows[flowFrom].flow += flow.bToA;
    }
  });
  graphData.links.push(...aggregatedFlows);
  console.log(graphData);
  return graphData;
}

export function convertDataForGraph(data: ICsApiData): IGraphData {
  const graphData: IGraphData = { nodes: [], links: [] };
  data.data.forEach((apiNode: INode) => {
    const isBridge = apiNode.metadata.toChain === undefined;

    const nodeName = apiNode.metadata.name.toLowerCase();
    let nodeIndex = graphData.nodes.findIndex((node) => node.name === nodeName);
    if (nodeIndex === -1) {
      nodeIndex = graphData.nodes.push({
        name: nodeName,
        type: isBridge ? 'bridge' : 'blockchain',
        value: apiNode.results.currentValueLocked,
        imageSrc:
          apiNode.metadata.icon === 0 ? '/logo.png' : apiNode.metadata.icon,
        audits: apiNode.metadata.audits ?? null,
        category: isBridge ? apiNode.metadata.category : null,
      });
    } else {
      graphData.nodes[nodeIndex].value += apiNode.results.currentValueLocked;
    }

    const fromName = apiNode.metadata.fromChain;
    let fromIndex = graphData.nodes.findIndex((node) => node.name === fromName);
    if (fromIndex === -1) {
      fromIndex = graphData.nodes.push({
        name: fromName,
        type: 'blockchain',
        value: apiNode.results.currentValueLocked,
        imageSrc:
          apiNode.metadata.icon === 0 ? '/logo.png' : apiNode.metadata.icon,
        audits: null,
        category: null,
      });
    } else {
      graphData.nodes[fromIndex].value += apiNode.results.currentValueLocked;
    }

    graphData.links.push({
      source: fromName,
      target: nodeName,
      tvl: apiNode.results.currentValueLocked,
    });
  });
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
