import { createContext, ReactNode, useContext } from 'react';
import { IData } from './types';

const DataContext = createContext<IData>({
  flows: [],
  chains: [],
  bridges: [],
});

export function DataProvider({
  data,
  children,
}: {
  data: IData;
  children: ReactNode;
}) {
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
