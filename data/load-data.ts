import dummyData from './dummy.json';
import { IDummyData } from './types';

export async function loadData(): Promise<IDummyData> {
  return dummyData as IDummyData;
}
