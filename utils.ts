import { CryptoStatsSDK } from '@cryptostats/sdk';
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

export interface INode {
  id: string;
  bundle: string | null;
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

export function convertDataForGraph(data: INode[]): IGraphData {
  const graphData: IGraphData = { nodes: [], links: [] };
  data.forEach((apiNode) => {
    if (apiNode.errors?.currentValueLocked) {
      return;
    }

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

export function getSDK() {
  const sdk = new CryptoStatsSDK({
    mongoConnectionString: process.env.MONGO_CONNECTION_STRING,
    redisConnectionString: process.env.REDIS_URL,
  });

  sdk
    .getCollection('bridged-value')
    .setCacheKeyResolver((_id: string, query: string, params: string[]) =>
      query === 'currentValueLocked' ? Math.floor(Date.now() / 1000 / 60 / 60).toString() : null
    );

    if (process.env.ALCHEMY_ETH_KEY) {
    const rpc = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_ETH_KEY}`
    sdk.ethers.addProvider('ethereum', rpc, { archive: true });
  } else {
    console.error('Alchemy key not set');
  }

  return sdk;
}
