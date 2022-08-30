import { GetStaticProps } from "next";

export interface IAudit {
  name: string;
  url: string;
  date: string;
}

export type BridgeCategory =
  | 'multisig-dynamic'
  | 'multisig-hardware'
  | 'multisig'
  | 'light-client'
  | 'native'
  | 'unknown';

export interface IDummyData {
  flows: IDummyFlow[];
  chains: IDummyChain[];
  bridges: IDummyBridge[];
}

export interface IDummyFlow {
  a: string;
  b: string;
  aToB: number;
  bToA: number;
  bridge: string;
}

export interface IDummyChain {
  name: string;
  logo: string;
}

export interface IDummyBridge {
  name: string;
  logo: string;
  website: string;
  type: BridgeCategory;
  audits?: IAudit[];
}

export type GetStaticBridgeProps<T = any> = GetStaticProps<T & { data: IDummyData }>
