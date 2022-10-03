import create from 'zustand';

interface IState {
  flowsShowImport: boolean;
  chainImportBoundaries: [number, number];
  setChainImports: (chainImportBoundaries: [number, number]) => void;
  chainExportBoundaries: [number, number];
  setChainExports: (chainExportBoundaries: [number, number]) => void;
  bridgeTvlBoundaries: [number, number];
  setBridgeTvlBoundaries: (bridgeTvlBoundaries: [number, number]) => void;
  showImportFlows: () => void;
  showExportFlows: () => void;
}

export const useStore = create<IState>((set) => ({
  flowsShowImport: true,
  chainImportBoundaries: [0, 0],
  setChainImports: (chainImportBoundaries) => set({ chainImportBoundaries }),
  chainExportBoundaries: [0, 0],
  setChainExports: (chainExportBoundaries) => set({ chainExportBoundaries }),
  bridgeTvlBoundaries: [0, 0],
  setBridgeTvlBoundaries: (bridgeTvlBoundaries) => set({ bridgeTvlBoundaries }),
  showImportFlows: () => set({ flowsShowImport: true }),
  showExportFlows: () => set({ flowsShowImport: false }),
}));
