import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { GLOW_ID, IMAGE_GLOW_ID } from '../constants';
import { useData } from '../data/data-context';
import { BridgeCategory } from '../data/types';
import { drawGraph, INetworkGraph } from '../drawGraph';
import { useStore } from '../store';
import style from '../styles/NetworkDiagram.module.css';
import { convertDataForGraph } from '../utils';
import { Tooltip } from './Tooltip';

interface IChainInput {
  x: number;
  y: number;
  chain: string;
  logo: string;
  exports: number;
  imports: number;
}

interface IFlowInput {
  x: number;
  y: number;
  chain1: string;
  chain2: string;
  logo1: string;
  logo2: string;
  value12: number;
  value21?: number;
}
interface IBridgeInput {
  x: number;
  y: number;
  name: string;
  logo: string;
  type: BridgeCategory | null;
  value: number;
}

export type TooltipChainArg = IChainInput | false;
export type TooltipFlowArg = IFlowInput | false;
export type TooltipBridgeArg = IBridgeInput | false;

let initialized = false;

export default function NetworkDiagram() {
  const router = useRouter();
  const { isImport, chainImportBoundaries, chainExportBoundaries } = useStore(
    (state) => ({
      isImport: state.flowsShowImport,
      chainImportBoundaries: state.chainImportBoundaries,
      chainExportBoundaries: state.chainExportBoundaries,
    }),
  );
  const [graph, setGraph] = useState<INetworkGraph>();
  const [showChainTooltip, setShowChainTooltip] =
    useState<TooltipChainArg>(false);
  const [showFlowTooltip, setShowFlowTooltip] = useState<TooltipFlowArg>(false);
  const [showBridgeTooltip, setShowBridgeTooltip] =
    useState<TooltipBridgeArg>(false);
  const data = useData();
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (data === undefined) return;
    if (graph !== undefined) {
      if (graph.showsImports() !== isImport) {
        graph.showImports(isImport);
        graph.updateSelected(router.asPath);
      }
      if (
        graph.importBoundaries()[0] !== chainImportBoundaries[0] ||
        graph.importBoundaries()[1] !== chainImportBoundaries[1]
      ) {
        graph.updateImportBoundaries(chainImportBoundaries);
      }
      if (
        graph.exportBoundaries()[0] !== chainExportBoundaries[0] ||
        graph.exportBoundaries()[1] !== chainExportBoundaries[1]
      ) {
        graph.updateExportBoundaries(chainExportBoundaries);
      }
      return;
    }
    if (initialized) return; // Otherwise below is called twice despite setGraph.
    if (svg.current !== null) {
      // Set filters as innerHTML because React doesn't recognize these
      // components and their typings.
      svg.current.innerHTML = `
      <defs>
        <filter id="${GLOW_ID}" width="300%" height="300%" x="-100%" y="-100%">
          <fegaussianblur
            class="blur"
            result="coloredBlur"
            stddeviation="3"
          ></fegaussianblur>
          <femerge>
            <femergenode in="coloredBlur"></femergenode>
            <femergenode in="SourceGraphic"></femergenode>
          </femerge>
        </filter>
        <filter id="${IMAGE_GLOW_ID}" width="300%" height="300%" x="-100%" y="-100%">
          <fegaussianblur
            class="blur"
            result="coloredBlur"
            stddeviation="10"
          ></fegaussianblur>
          <femerge>
          <femergenode in="coloredBlur"></femergenode>
          </femerge>
        </filter>
      </defs>`;
    }
    const convertedData = convertDataForGraph(data);
    const navigateTo = (path: string) =>
      router.push(path, undefined, { scroll: false });
    const viz = drawGraph(
      svg,
      convertedData,
      navigateTo,
      setShowChainTooltip,
      setShowFlowTooltip,
      setShowBridgeTooltip,
    );
    const updateUrl = (path: string) => viz.updateSelected(path);
    router.events.on('routeChangeStart', updateUrl);
    initialized = true;
    setGraph(viz);
  }, [
    svg,
    data,
    router,
    graph,
    isImport,
    setShowBridgeTooltip,
    setShowChainTooltip,
    setShowFlowTooltip,
    chainImportBoundaries,
    chainExportBoundaries,
  ]);

  return (
    <div className={style.networkDiagram}>
      <svg ref={svg}></svg>
      <Tooltip
        showChainTooltip={showChainTooltip}
        showFlowTooltip={showFlowTooltip}
        showBridgeTooltip={showBridgeTooltip}
      />
    </div>
  );
}
