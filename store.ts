import create from 'zustand';

interface IState {
  flowsShowImport: boolean;
  chainMinImport: number;
  chainMaxImport: number;
  chainMinExport: number;
  chainMaxExport: number;
  bridgeMinTvl: number;
  bridgeMaxTvl: number;
  showImportFlows: () => void;
  showExportFlows: () => void;
}

export const useStore = create<IState>((set) => ({
  flowsShowImport: true,
  chainMinImport: 0,
  chainMaxImport: 0,
  chainMinExport: 0,
  chainMaxExport: 0,
  bridgeMinTvl: 0,
  bridgeMaxTvl: 0,
  showImportFlows: () => set({ flowsShowImport: true }),
  showExportFlows: () => set({ flowsShowImport: false }),
}));
