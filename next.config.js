/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'ipfs.io',
      'cryptologos.cc',
      'l2beat.com',
      'defillama.com',
      'openocean.finance',
      'commonwealth-uploads.s3.us-east-2.amazonaws.com',
      'images.prismic.io',
      'ipfs.io',
      'alphagrowth.io',
      'images.ctfassets.net',
      'kronosresearch.com',
      'cryptostats.infura-ipfs.io',
    ],
  },
};

module.exports = nextConfig;
