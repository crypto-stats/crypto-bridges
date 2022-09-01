import { getSDK } from './sdk';
import dummyData from './dummy.json';
import { IDummyData } from './types';

const useDummy = true

export async function loadData(): Promise<IDummyData> {
  if (useDummy) {
    return dummyData as any;
  }
  const sdk = getSDK();
  const collection = sdk.getCollection('bridged-value');
  await collection.fetchAdapters();

  const flows: any = await collection.executeQueriesWithMetadata(['currentValueBridgedAToB', 'currentValueBridgedBToA']);

  const bridges: any = await collection.getBundles();
  console.log(JSON.stringify(bridges))

  return { flows, bridges, chains: dummyData.chains as any };
}
