import { FOOTER_HEIGHT, HEADER_HEIGHT, PANEL_WIDTH } from './constants';

export interface IGraphNode {
  name: string;
  value: number;
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
    subtitle: string;
    icon: string;
    fromChain: string;
  };
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

export function useHorizontalLayout(): boolean {
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
  const isLandscape = useHorizontalLayout();
  return {
    width: isLandscape ? window.innerWidth - PANEL_WIDTH : window.innerWidth,
    height: isLandscape
      ? window.innerHeight - HEADER_HEIGHT - FOOTER_HEIGHT
      : window.innerWidth * 0.6,
  };
}
