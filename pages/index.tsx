import type { NextPage } from 'next';
import Link from 'next/link';

const Home: NextPage = () => {
  return (
    <div>
      <Link href="bridge/:bridgeId" scroll={false}>
        bridges
      </Link>
      <Link href="chain/:chainId" scroll={false}>
        chains
      </Link>
    </div>
  );
};

export default Home;
