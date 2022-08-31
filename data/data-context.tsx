import { createContext, ReactNode, useContext } from "react";
import { IDummyData } from "./types";

const DataContext = createContext<IDummyData>({
  flows: [],
  chains: [],
  bridges: [],
});

export function DataProvider({ data, children }: { data: IDummyData, children: ReactNode }) {
  return (
    <DataContext.Provider value={data}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext)
