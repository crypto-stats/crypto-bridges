import type { NextPage } from 'next';
import Link from 'next/link';

const Home: NextPage = () => {
  return (
    <div>
      <Link href="bridges" scroll={false}>
        bridges
      </Link>
      <Link href="chains" scroll={false}>
        chains
      </Link>
    </div>
  );
};

export default Home;
