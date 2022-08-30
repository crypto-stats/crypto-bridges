import { FOOTER_HEIGHT, HEADER_HEIGHT, PANEL_WIDTH } from './constants';

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

export interface IFlowBridgesGraphLink {
  source: string;
  target: string;
  bridge: string;
  logo: string;
  website: string;
  flow: number;
  type: BridgeCategory | null;
  audits: IAudit[] | null;
}

export interface IFlowBridgesGraphNode {
  chain: string;
  logo: string;
  tvl: number;
  in: number;
}

export interface IFlowBridgesGraphData {
  nodes: IFlowBridgesGraphNode[];
  links: IFlowBridgesGraphLink[];
}

export interface IAudit {
  name: string;
  url: string;
  date: string;
}

type BridgeCategory =
  | 'multisig-dynamic'
  | 'multisig-hardware'
  | 'multisig'
  | 'light-client'
  | 'native'
  | 'unknown';

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

export interface IDummyData {
  flows: IDummyFlow[];
  chains: IDummyChain[];
  bridges: IDummyBridge[];
}

interface IDummyFlow {
  a: string;
  b: string;
  aToB: number;
  bToA: number;
  bridge: string;
}

interface IDummyChain {
  name: string;
  logo: string;
}

interface IDummyBridge {
  name: string;
  logo: string;
  website: string;
  type: BridgeCategory;
  audits?: IAudit[];
}

export function convertDummyDataForGraph(
  data: IDummyData,
): IFlowBridgesGraphData {
  const graphData: IFlowBridgesGraphData = { nodes: [], links: [] };
  data.flows.forEach((flow) => {
    const chainA = graphData.nodes.findIndex((node) => node.chain === flow.a);
    if (chainA === -1) {
      const chain = data.chains.find((chain) => chain.name === flow.a);
      if (chain === undefined) {
        console.error('Data error: no matching chain in data');
        return;
      }
      graphData.nodes.push({
        chain: flow.a,
        logo: chain.logo,
        tvl: flow.aToB,
        in: flow.bToA,
      });
    } else {
      graphData.nodes[chainA].tvl += flow.aToB;
      graphData.nodes[chainA].in += flow.bToA;
    }
    const chainBIndex = graphData.nodes.findIndex(
      (node) => node.chain === flow.b,
    );
    if (chainBIndex === -1) {
      const chain = data.chains.find((chain) => chain.name === flow.b);
      if (chain === undefined) {
        console.error('Data error: no matching chain in data');
        return;
      }
      graphData.nodes.push({
        chain: flow.b,
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
      console.error('Data error: no matching bridge in data');
      return;
    }
    graphData.links.push({
      source: flow.a,
      target: flow.b,
      website: bridge.website,
      audits: bridge.audits ?? null,
      type: bridge.type,
      flow: flow.aToB,
      bridge: flow.bridge,
      logo: bridge.logo,
    });
    graphData.links.push({
      source: flow.b,
      target: flow.a,
      website: bridge.website,
      audits: bridge.audits ?? null,
      type: bridge.type,
      flow: flow.bToA,
      bridge: flow.bridge,
      logo: bridge.logo,
    });
  });
  return graphData;
}

export function convertDataForGraph(data: ICsApiData): IGraphData {
  const graphData: IGraphData = { nodes: [], links: [] };
  data.data.forEach((apiNode) => {
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
