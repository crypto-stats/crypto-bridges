import Slider from '@mui/material/Slider';
import { useState } from 'react';
import { useData } from '../data/data-context';
import styles from '../styles/Header.module.css';
import { convertDataForGraph, formatShort } from '../utils';

export const Filters = ({
  isHorizontal,
  show,
  closeFilters,
}: {
  isHorizontal: boolean;
  show: boolean;
  closeFilters: () => void;
}) => {
  const data = useData();
  const convertedData = convertDataForGraph(data);
  const bridgesFlow = convertedData.links
    .filter((link) => (link as any).bridge !== undefined)
    .map((link) => link.flow);
  const chainsTvl = convertedData.nodes.map((node) => node.tvl);
  const boundaries = {
    minChainImport: Math.min(...chainsTvl),
    maxChainImport: Math.max(...chainsTvl),
    minChainExport: Math.min(...chainsTvl),
    maxChainExport: Math.max(...chainsTvl),
    minBridgeFlow: Math.min(...bridgesFlow),
    maxBridgeFlow: Math.max(...bridgesFlow),
  };
  const [importBoundaries, setImportBoundaries] = useState([
    boundaries.minChainImport,
    boundaries.maxChainImport,
  ]);
  const updateChainImport = (e: any, values: number[]) =>
    setImportBoundaries(values);
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
            value={importBoundaries}
            onChange={updateChainImport as any}
            valueLabelDisplay="on"
            valueLabelFormat={(value: number, index: number) =>
              formatShort(value)
            }
            scale={(x) => x}
            min={boundaries.minChainImport}
            max={boundaries.maxChainImport}
          />
        </div>
      </div>
    </div>
  ) : null;
};
