import type { NextPage } from 'next';
import { useRouter } from 'next/router';

const Bridge: NextPage = () => {
  const { query } = useRouter();
  return <div>bridge {query.bridge}</div>;
};

export default Bridge;
