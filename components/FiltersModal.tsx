import Slider from '@mui/material/Slider';
import { useEffect, useMemo } from 'react';
import { useData } from '../data/data-context';
import { useStore } from '../store';
import styles from '../styles/Header.module.css';
import { convertDataForGraph, findLogParameters, formatShort } from '../utils';

export const FiltersModal = ({
  isHorizontal,
  show,
  closeFilters,
  setFilters,
  filters,
}: {
  isHorizontal: boolean;
  show: boolean;
  closeFilters: () => void;
  setFilters: (filters: string[]) => void;
  filters: string[];
}) => {
  const data = useData();
  const {
    chainImportBoundaries,
    setChainImports,
    chainExportBoundaries,
    setChainExports,
  } = useStore((state) => ({
    chainImportBoundaries: state.chainImportBoundaries,
    setChainImports: state.setChainImports,
    chainExportBoundaries: state.chainExportBoundaries,
    setChainExports: state.setChainExports,
  }));
  const { importMarks, exportMarks, scale, log, max } = useMemo(() => {
    const convertedData = convertDataForGraph(data);
    const chainsTvl = convertedData.nodes.map((node) => node.tvl);
    const max = Math.max(...chainsTvl);
    const [kALog, kBLog] = findLogParameters(1, max, 0, 100);
    const log = (value: number) => kALog * Math.log((value + 1) * kBLog);
    const scale = (value: number) => Math.exp(value / kALog) / kBLog - 1;
    const importMarks = convertedData.nodes.map((node) => ({
      label: node.name,
      // The material UI slider internally assigns `key={value}` to the dots,
      // hence add randomness to be sure they're never the same.
      value: Math.max(0, log(node.in) + Math.random() / 1000),
    }));
    const exportMarks = convertedData.nodes.map((node) => ({
      label: node.name,
      // See above
      value: Math.max(0, log(node.tvl)) + Math.random() / 1000,
    }));
    return {
      kALog,
      kBLog,
      log,
      max,
      scale,
      importMarks,
      exportMarks,
    };
  }, [data]);
  const updateChainImport = (e: any, values: [number, number]) => {
    if (values[0] === 0 && values[1] === scale(100)) {
      setFilters(filters.filter((name) => name !== 'chainImport'));
    } else if (!filters.includes('chainImport')) {
      setFilters([...filters, 'chainImport']);
    }
    setChainImports([scale(values[0]), scale(values[1])]);
  };
  const updateChainExport = (e: any, values: [number, number]) => {
    if (values[0] === 0 && values[1] === scale(100)) {
      setFilters(filters.filter((name) => name !== 'chainExport'));
    } else if (!filters.includes('chainExport')) {
      setFilters([...filters, 'chainExport']);
    }
    setChainExports([scale(values[0]), scale(values[1])]);
  };
  useEffect(() => {
    if (
      (chainImportBoundaries[0] !== 0 ||
        chainImportBoundaries[1] !== max + 1) &&
      !filters.includes('chainImport')
    ) {
      setChainImports([0, max + 1]);
    }
    if (
      (chainExportBoundaries[0] !== 0 ||
        chainExportBoundaries[1] !== max + 1) &&
      !filters.includes('chainExport')
    ) {
      setChainExports([0, max + 1]);
    }
  }, [
    filters,
    chainImportBoundaries,
    chainExportBoundaries,
    scale,
    setChainExports,
    setChainImports,
    max,
  ]);
  return show ? (
    <div
      className={
        isHorizontal
          ? styles.filtersModalHorizontal
          : styles.filtersModalVertical
      }
    >
      {!isHorizontal && (
        <button onClick={closeFilters} className={styles.closeFiltersButton}>
          ×
        </button>
      )}
      <div className={styles.filter}>
        <h3>Value Imported</h3>
        <div className={styles.inputRange}>
          <Slider
            value={[
              log(chainImportBoundaries[0]),
              log(chainImportBoundaries[1]),
            ]}
            onChange={updateChainImport as any}
            valueLabelDisplay="on"
            valueLabelFormat={(value: number) => formatShort(value, 1)}
            scale={scale}
            marks={importMarks}
            min={0}
            max={100}
          />
        </div>
      </div>
      <div className={styles.filter}>
        <h3>Value Exported</h3>
        <div className={styles.inputRange}>
          <Slider
            value={[
              log(chainExportBoundaries[0]),
              log(chainExportBoundaries[1]),
            ]}
            onChange={updateChainExport as any}
            valueLabelDisplay="on"
            valueLabelFormat={(value: number) => formatShort(value, 1)}
            scale={scale}
            marks={exportMarks}
            min={0}
            max={100}
          />
        </div>
      </div>
    </div>
  ) : null;
};
