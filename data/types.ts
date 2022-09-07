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
  id: string
  results: {
    currentValueBridgedAToB: number | null;
    currentValueBridgedBToA: number | null;
  },
  bundle: string/*  | null */;
  metadata: {
    name: string;
    subtitle?: string;
    chainA: string;
    chainB: string;
  },
}

export interface IDummyChain {
  id: string;
  name?: string;
  logo: string;
  description?: string;
  website?: string;
  whitepaper?: string;
}

export interface IDummyBridge {
  id: string
  metadata: {
    name: string
    category: BridgeCategory
    icon: string
    website?: string
    audits?: IAudit[];
  }
}

export type GetStaticBridgeProps<T = any> = GetStaticProps<T & { data: IDummyData }>
