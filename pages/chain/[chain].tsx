import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import BackButton from '../../components/BackButton';
import Motion from '../../components/Motion';
import Table from '../../components/Table';
import { BRIDGED_VALUE_API_URL } from '../../constants';
import styles from '../../styles/page.module.css';
import type { IGraphData } from '../../utils';
import { convertDataForGraph } from '../../utils';

interface IChainProps {
  chain: string;
  data: IGraphData;
}

interface IChainPath {
  params: { chain: string };
}

const Chain: NextPage<IChainProps> = ({ chain, data }: IChainProps) => {
  const router = useRouter();
  const chainName = chain.split('-').join(' ');
  const value = data.nodes
    .filter((node) => node.type === 'blockchain')
    .find((chainNode) => chainNode.name === chainName)?.value;
  return (
    <Motion key={router.asPath}>
      <section className={styles.section}>
        <BackButton />
        <p>
          This is the page about the {chain} chain, with a tvl of {value}.
        </p>
        <Table
          listsChains={true}
          title={'connected bridges'}
          tableContent={data.nodes
            .filter((node) => {
              for (const link of data.links) {
                if (
                  (link.target === chainName && link.source === node.name) ||
                  (link.source === chainName && link.target === node.name)
                ) {
                  return node.type === 'bridge';
                }
              }
              return false;
            })
            .map((node) => ({
              name: node.name,
              logo: node.imageSrc,
              bridgedIn: node.value,
              bridgedOut: node.value,
            }))}
        />
      </section>
    </Motion>
  );
};

export async function getStaticPaths(): Promise<{
  fallback: boolean;
  paths: IChainPath[];
}> {
  const data: IGraphData = await fetch(BRIDGED_VALUE_API_URL)
    .then((r) => r.json())
    .then(convertDataForGraph);
  const paths = data.nodes
    .filter((node) => node.type === 'blockchain')
    .map(({ name }) => {
      return { params: { chain: name.split(' ').join('-') } };
    });
  return { paths, fallback: false };
}

export async function getStaticProps({
  params,
}: IChainPath): Promise<{ props: IChainProps }> {
  const data: IGraphData = await fetch(BRIDGED_VALUE_API_URL)
    .then((r) => r.json())
    .then(convertDataForGraph);
  return {
    props: { ...params, data },
  };
}

export default Chain;
