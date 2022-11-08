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
}

export async function getSecurityData(id: string): Promise<ISecurityData | null> {
  const response = await fetch(`https://v1.nocodeapi.com/kallemoen/airtable/pzFlVZPATntbwBAk?tableName=Bridges&filterByFormula=Bridge%3D"${id}%22`);
  const json = await response.json();
  return json.records?.length ? {
    ...json.records[0].fields,
    trustRanking: trustStringToEnum[json.records[0].fields[FIELDS.TRUSTLESSNESS]] || null,
  } : null;
}
