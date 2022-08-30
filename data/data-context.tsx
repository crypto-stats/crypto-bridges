import { createContext, ReactNode, useContext } from "react";
import { IDataContext } from "./types";

const DataContext = createContext<IDataContext>({ subBridges: [] });

export function DataProvider({ data, children }: { data: IDataContext, children: ReactNode }) {
  return (
    <DataContext.Provider value={data}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext)
