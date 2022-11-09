import Airtable from "airtable";

export const FIELDS = {
  BRIDGE: 'Bridge' as 'Bridge',
  DESCRIPTION: 'Description' as 'Description',
  CATEGORY: 'Category' as 'Category',
  ASSUMPTIONS: 'Security assumptions' as 'Security assumptions',
  TRUSTLESSNESS: 'Trustlessness' as 'Trustlessness',
  DOCUMENTATION: 'Documentation' as 'Documentation',
  BOUNTY_MAX: 'Bounty max' as 'Bounty max',
  BOUNTY_START_DATE: 'Bounty live since' as 'Bounty live since',
  BOUNTY_URL: 'Bounty link' as 'Bounty link',
}

export type Trust = 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';

export interface ISecurityData {
  [FIELDS.BRIDGE]: string;
  [FIELDS.DESCRIPTION]: string;
  [FIELDS.CATEGORY]: string;
  [FIELDS.ASSUMPTIONS]: string;
  [FIELDS.TRUSTLESSNESS]: Trust;
  [FIELDS.DOCUMENTATION]: string;
  [FIELDS.BOUNTY_MAX]: string;
  [FIELDS.BOUNTY_START_DATE]: string;
  [FIELDS.BOUNTY_URL]: string;
  trustRanking: Trust | null;
}

const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time * 1000));

export async function getSecurityData(id: string): Promise<ISecurityData | null> {
  await wait(Math.random() * 5 * 8);

  const base = new Airtable({
    apiKey: process.env.AIR_TABLE_API_KEY,
  }).base('apppls15bkAlz7ko1');
  const table = base('tblZZDK3wwSUKWy5J');
  const result = await table.select({ filterByFormula: `Bridge="${id}"` }).all();
  return result.length > 0 ? result[0].fields as unknown as ISecurityData : null;
}
