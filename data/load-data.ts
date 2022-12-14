import chainData from './chains.json';
import dummyData from './dummy.json';
import { getSDK } from './sdk';
import { IData } from './types';

const useDummy = process.env.NODE_ENV !== 'production';

function removeIcons(data: any[]) {
  for (const item of data) {
    if (item.metadata.icon) {
      delete item.metadata.icon;
    }
  }
}

removeIcons(dummyData.flows);

export async function loadData(): Promise<IData> {
  if (useDummy) {
    return { ...dummyData, ...chainData } as any;
  }
  const sdk = getSDK();
  const collection = sdk.getCollection('bridged-value');
  await collection.fetchAdapters();

  const flows: any = await collection.executeQueriesWithMetadata([
    'currentValueBridgedAToB',
    'currentValueBridgedBToA',
  ]);
  for (const flow of flows) {
    for (let errorQuery in flow.errors) {
      console.warn(flow.errors[errorQuery]);
    }
  }
  removeIcons(flows);

  const bridges: any = await collection.getBundles();

  return { flows, bridges, chains: chainData.chains as any };
}
