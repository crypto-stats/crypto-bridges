import Head from 'next/head';

export default function HtmlHead() {
  return (
    <Head>
      <title>Cryptobridges</title>
      <meta
        name="description"
        content="Data sets and views on crypto economics"
      />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
}
