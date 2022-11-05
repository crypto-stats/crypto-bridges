import { GetStaticProps } from 'next';

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

export interface IData {
  flows: IFlow[];
  chains: IChain[];
  bridges: IBridge[];
}

export interface IFlow {
  id: string;
  results: {
    currentValueBridgedAToB: number | null;
    currentValueBridgedBToA: number | null;
  };
  errors?: { [key: string]: string };
  bundle: string /*  | null */;
  metadata: {
    name: string;
    subtitle?: string;
    chainA: string;
    chainB: string;
  };
}

export interface IChain {
  id: string;
  name?: string;
  logo: string;
  description?: string;
  website?: string;
  whitepaper?: string;
}

export interface IBridge {
  id: string;
  metadata: {
    name: string;
    category: BridgeCategory;
    icon: string;
    website?: string;
    audits?: IAudit[];
  };
}

export type GetStaticBridgeProps<T = any> = GetStaticProps<
  T & { data: IData; date: string },
  { bridge: string }
>;
