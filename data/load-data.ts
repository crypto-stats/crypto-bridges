import { getSDK } from "./sdk";
import { IDataContext, SubBridge } from "./types";

export async function loadData(): Promise<IDataContext> {
  const sdk = getSDK();
  const collection = sdk.getCollection('bridged-value');
  await collection.fetchAdapters();

  const data = await collection.executeQueriesWithMetadata(['currentValueLocked']) as SubBridge[];

  return { subBridges: data };
}
