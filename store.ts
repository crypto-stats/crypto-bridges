import create from 'zustand';

interface IState {
  flowsShowImport: boolean;
  showImportFlows: () => void;
  showExportFlows: () => void;
}

export const useStore = create<IState>((set) => ({
  flowsShowImport: true,
  showImportFlows: () => set({ flowsShowImport: true }),
  showExportFlows: () => set({ flowsShowImport: false }),
}));
