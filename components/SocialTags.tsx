import React from 'react';
import Head from 'next/head';

interface SocialTagsProps {
  title?: string | null;
  description?: string | null;
}

const SocialTags = ({ title, description }: SocialTagsProps) => {
  const shortTitle = title ? `${title} - CryptoFlows.info` : 'CryptoFlows.info';
  const fullTitle = title ? `${title} - CryptoFlows.info` : 'CryptoFlows.info - Mapping the chains & bridges of the blockchain economy';
  const _description = description || 'Mapping the chains & bridges of the global blockchain economy';

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta
        name="description"
        content="Data sets and views on crypto economics"
      />

      <meta property="og:title" content={shortTitle} />
      <meta
        property="og:image"
        content={`https://${process.env.NEXT_PUBLIC_VERCEL_URL!}/open-graph.png`}
      />
      <meta property="og:description" content={_description} />

      <meta name="twitter:title" content={shortTitle} />
      <meta name="twitter:description" content={_description} />
      <meta
        name="twitter:image"
        content={`https://${process.env.NEXT_PUBLIC_VERCEL_URL!}/open-graph.png`}
      />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  );
};

export default SocialTags;
