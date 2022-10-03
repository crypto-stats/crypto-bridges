import Slider from '@mui/material/Slider';
import { m, Variants } from 'framer-motion';
import { useEffect, useMemo } from 'react';
import { useData } from '../data/data-context';
import { useStore } from '../store';
import styles from '../styles/Header.module.css';
import { convertDataForGraph, formatShort } from '../utils';

const ANIMATIONS: Variants = {
  initial: {
    opacity: 0,
    x: 200,
    y: -130,
    scale: 0,
  },
  initialVertical: {
    opacity: 0,
    x: 0,
    y: 200,
    scale: 1,
  },
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
  },
};

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
  const { boundaries, importMarks, exportMarks } = useMemo(() => {
    const convertedData = convertDataForGraph(data);
    const bridgesFlow = convertedData.links
      .filter((link) => (link as any).bridge !== undefined)
      .map((link) => link.flow);
    const chainsTvl = convertedData.nodes.map((node) => node.tvl);
    return {
      importMarks: convertedData.nodes.map((node) => ({
        label: node.name,
        // The material UI slider internally assigns `key={value}` to the dots,
        // hence add randomness to be sure they're never the same.
        value: node.in + Math.random() / 1000,
      })),
      exportMarks: convertedData.nodes.map((node) => ({
        label: node.name,
        // See above
        value: node.tvl + Math.random() / 1000,
      })),
      boundaries: {
        minChainImport: 0,
        maxChainImport: Math.max(...chainsTvl),
        minChainExport: 0,
        maxChainExport: Math.max(...chainsTvl),
        minBridgeFlow: Math.min(...bridgesFlow),
        maxBridgeFlow: Math.max(...bridgesFlow),
      },
    };
  }, [data]);
  const updateChainImport = (e: any, values: [number, number]) => {
    if (
      values[0] === boundaries.minChainImport &&
      values[1] === boundaries.maxChainImport
    ) {
      setFilters(filters.filter((name) => name !== 'chainImport'));
    } else if (!filters.includes('chainImport')) {
      setFilters([...filters, 'chainImport']);
    }
    setChainImports(values);
  };
  const updateChainExport = (e: any, values: [number, number]) => {
    if (
      values[0] === boundaries.minChainExport &&
      values[1] === boundaries.maxChainExport
    ) {
      setFilters(filters.filter((name) => name !== 'chainExport'));
    } else if (!filters.includes('chainExport')) {
      setFilters([...filters, 'chainExport']);
    }
    setChainExports(values);
  };
  useEffect(() => {
    if (
      (chainImportBoundaries[0] !== boundaries.minChainImport ||
        chainImportBoundaries[1] !== boundaries.maxChainImport) &&
      !filters.includes('chainImport')
    ) {
      setChainImports([boundaries.minChainImport, boundaries.maxChainImport]);
    }
    if (
      (chainExportBoundaries[0] !== boundaries.minChainExport ||
        chainExportBoundaries[1] !== boundaries.maxChainExport) &&
      !filters.includes('chainExport')
    ) {
      setChainExports([boundaries.minChainExport, boundaries.maxChainExport]);
    }
  }, [filters, chainImportBoundaries, chainExportBoundaries, boundaries]);
  return show ? (
    <m.div
      className={
        isHorizontal
          ? styles.filtersModalHorizontal
          : styles.filtersModalVertical
      }
      initial={isHorizontal ? 'initial' : 'initialVertical'}
      animate={'animate'}
      variants={ANIMATIONS}
      transition={{ duration: 0.25 }}
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
            value={chainImportBoundaries}
            onChange={updateChainImport as any}
            valueLabelDisplay="on"
            valueLabelFormat={(value: number, index: number) =>
              formatShort(value, 1)
            }
            scale={(x) => x}
            marks={importMarks}
            min={boundaries.minChainImport}
            max={boundaries.maxChainImport}
          />
        </div>
      </div>
      <div className={styles.filter}>
        <h3>Value Exported</h3>
        <div className={styles.inputRange}>
          <Slider
            value={chainExportBoundaries}
            onChange={updateChainExport as any}
            valueLabelDisplay="on"
            valueLabelFormat={(value: number, index: number) =>
              formatShort(value, 1)
            }
            scale={(x) => x}
            marks={exportMarks}
            min={boundaries.minChainExport}
            max={boundaries.maxChainExport}
          />
        </div>
      </div>
    </m.div>
  ) : null;
};
