import Airtable from 'airtable';
import type { NextPage } from 'next';
import BackButton from '../../components/BackButton';
import BridgeSpecifics, { ISecurityData } from '../../components/Bridge';
import Motion from '../../components/Motion';
import Table from '../../components/Table';
import { loadData } from '../../data/load-data';
import { GetStaticBridgeProps, IData } from '../../data/types';
import styles from '../../styles/page.module.css';

interface IBridgeProps {
  bridge: string;
  data: IData;
  date: string;
  securityData?: ISecurityData;
}

interface IBridgePath {
  params: { bridge: string };
}

const Bridge: NextPage<IBridgeProps> = ({
  bridge,
  data,
  date,
  securityData,
}: IBridgeProps) => {
  console.log(`Data for bridge page ${bridge} collected on ${date}`);
  return (
    <Motion>
      <section className={styles.section}>
        <BackButton />
        <BridgeSpecifics data={data} id={bridge} securityData={securityData} />
        <Table
          listsChains={true}
          title={'connected chains'}
          tableContent={data.chains
            .filter((chain) => {
              for (const flow of data.flows) {
                if (
                  flow.bundle === bridge &&
                  (flow.metadata.chainA === chain.id ||
                    flow.metadata.chainB === chain.id)
                ) {
                  return true;
                }
              }
              return false;
            })
            .map((chain) => {
              let flowIn = 0;
              let flowOut = 0;
              for (const flow of data.flows) {
                if (flow.bundle !== bridge) {
                  continue;
                }
                if (flow.metadata.chainA === chain.id) {
                  flowIn += flow.results.currentValueBridgedBToA || 0;
                  flowOut += flow.results.currentValueBridgedAToB || 0;
                } else if (flow.metadata.chainB === chain.id) {
                  flowIn += flow.results.currentValueBridgedAToB || 0;
                  flowOut += flow.results.currentValueBridgedBToA || 0;
                }
              }
              return {
                id: chain.id,
                name: chain.name || chain.id.replaceAll('-', ' '),
                logo: chain.logo,
                in: flowIn,
                tvl: flowOut,
              };
            })}
        />
      </section>
    </Motion>
  );
};

export async function getStaticPaths(): Promise<{
  fallback: boolean;
  paths: IBridgePath[];
}> {
  const data = await loadData();
  const paths = data.bridges.map((bridge): IBridgePath => {
    return { params: { bridge: bridge.id } };
  });
  return { paths, fallback: false };
}

export const getStaticProps: GetStaticBridgeProps = async ({ params }) => {
  const data = await loadData();
  const date = new Date().toString();
  const securityData = await new Promise<ISecurityData>((resolve, reject) => {
    const base = new Airtable({
      apiKey: process.env.AIR_TABLE_API_KEY,
    }).base('apppls15bkAlz7ko1');
    base('tblZZDK3wwSUKWy5J') // ="Table 1"
      .select({ view: 'Grid view' })
      .eachPage((records) => {
        const entry = records.find(
          (records) => records.fields['Bridge'] === params?.bridge,
        );
        if (entry === undefined) {
          return reject();
        }
        resolve(entry.fields as unknown as ISecurityData);
      });
  });
  return { props: { data, date, securityData, ...params }, revalidate: 5 * 60 };
};

export default Bridge;
