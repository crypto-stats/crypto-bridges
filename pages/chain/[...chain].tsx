import type { NextPage } from 'next';
import { useRouter } from 'next/router';

const Chain: NextPage = () => {
  const { query } = useRouter();
  return <div>chain {query.chain}</div>;
};

export default Chain;
