import { GetStaticProps } from "next";

export interface SubBridge {
  metadata: any
  results: any
}

export interface IDataContext {
  subBridges: SubBridge[];
}

export type GetStaticBridgeProps<T = any> = GetStaticProps<T & { data: IDataContext }>
