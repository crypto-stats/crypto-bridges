import { getSDK } from './sdk';
import dummyData from './dummy.json';
import chainData from './chains.json';
import { IDummyData } from './types';

const useDummy = process.env.NODE_ENV !== 'production'

export async function loadData(): Promise<IDummyData> {
  if (useDummy) {
    return { ...dummyData, ...chainData } as any;
  }
  const sdk = getSDK();
  const collection = sdk.getCollection('bridged-value');
  await collection.fetchAdapters();

  const flows: any = await collection.executeQueriesWithMetadata(['currentValueBridgedAToB', 'currentValueBridgedBToA']);

  const bridges: any = await collection.getBundles();

  return { flows, bridges, chains: chainData.chains as any };
}
