import Head from 'next/head';

export default function HtmlHead() {
  return (
    <Head>
      <title>Cryptobridges</title>
      <meta
        name="description"
        content="Data sets and views on crypto economics"
      />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
}
