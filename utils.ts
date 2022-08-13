import {
  FOOTER_HEIGHT,
  HEADER_HEIGHT,
  NODE_AREAS_SHARE,
  PANEL_WIDTH,
} from './constants';

export interface IGraphNode {
  name: string;
  value: number;
  imageSrc: string;
  type: 'blockchain' | 'bridge';
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

interface INode {
  id: string;
  bundle: null;
  results: { currentValueLocked: number };
  metadata: {
    name: string;
    toChain?: string;
    website?: string;
    category:
      | 'multisig-dynamic'
      | 'multisig-hardware'
      | 'multisig'
      | 'light-client'
      | 'native'
      | 'unknown';
    subtitle: string;
    icon: string | 0;
    fromChain: string;
  };
  errors: { [key: string]: string };
}

export interface ICsApiData {
  success: boolean;
  data: INode[];
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
  return (
    window.innerHeight - HEADER_HEIGHT - FOOTER_HEIGHT <
    window.innerWidth - PANEL_WIDTH + 250
  );
}

interface IDimensions {
  width: number;
  height: number;
}

export function getDiagramDimensions(): IDimensions {
  const isLandscape = needsLandscape();
  return {
    width: isLandscape ? window.innerWidth - PANEL_WIDTH : window.innerWidth,
    height: isLandscape
      ? window.innerHeight - HEADER_HEIGHT - FOOTER_HEIGHT
      : window.innerWidth * 0.6,
  };
}

export function addLeadingZero(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

// Logarithmic constants:
// node radius distribution follows A * log(B * value)
// (https://math.stackexchange.com/questions/716152/graphing-given-two-points-on-a-graph-find-the-logarithmic-function-that-passes)
export function findLogParameters(min: number, max: number): [number, number] {
  const A = (NODE_AREAS_SHARE.MIN - NODE_AREAS_SHARE.MAX) / Math.log(min / max);
  const B = Math.exp(
    (NODE_AREAS_SHARE.MAX * Math.log(min) -
      NODE_AREAS_SHARE.MIN * Math.log(max)) /
      (NODE_AREAS_SHARE.MIN - NODE_AREAS_SHARE.MAX),
  );
  return [A, B];
}

// Linear constants:
// node radius distribution follows (A * value + B)
export function findLinearParameters(
  min: number,
  max: number,
): [number, number] {
  const A = (NODE_AREAS_SHARE.MAX - NODE_AREAS_SHARE.MIN) / (max - min);
  const B = NODE_AREAS_SHARE.MAX - max * A;
  return [A, B];
}
