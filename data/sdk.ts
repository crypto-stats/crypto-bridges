import { CryptoStatsSDK } from "@cryptostats/sdk";

const CACHED_QUERIES = [
  'currentValueBridged',
  'currentValueBridgedAToB',
  'currentValueBridgedBToA',
];

export function getSDK() {
  const sdk = new CryptoStatsSDK({
    mongoConnectionString: process.env.MONGO_CONNECTION_STRING,
    redisConnectionString: process.env.REDIS_URL,
    executionTimeout: process.env.ADAPTER_EXECUTION_TIMEOUT ? parseInt(process.env.ADAPTER_EXECUTION_TIMEOUT) : 60,
  });

  // Hourly caches
  sdk
    .getCollection('bridged-value')
    .setCacheKeyResolver((_id: string, query: string, params: string[]) =>
      CACHED_QUERIES.includes(query) ? Math.floor(Date.now() / 1000 / 60 / 60).toString() : null
    );

    if (process.env.ALCHEMY_ETH_KEY) {
    const rpc = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_ETH_KEY}`
    sdk.ethers.addProvider('ethereum', rpc, { archive: true });
  } else {
    console.error('Alchemy key not set');
  }

  sdk.cosmos.addChain('cosmoshub', 'https://cosmos-mainnet-rpc.allthatnode.com:26657/');
  sdk.cosmos.addChain('osmosis', 'https://osmosis-mainnet-rpc.allthatnode.com:26657');
  sdk.ethers.addProvider('bsc', 'https://binance.nodereal.io');

  sdk.ethers.addProvider('moonbeam', 'https://rpc.api.moonbeam.network');
  sdk.ethers.addProvider('acala', 'https://eth-rpc-acala.aca-api.network');
  sdk.ethers.addProvider('polygon', 'https://matic-mainnet-archive-rpc.bwarelabs.com', { archive: true });
  sdk.ethers.addProvider('gnosis-chain', 'https://rpc.gnosischain.com');
  sdk.ethers.addProvider('avalanche', 'https://api.avax.network/ext/bc/C/rpc');
  sdk.ethers.addProvider('arbitrum-one', 'https://arb1.arbitrum.io/rpc');
  sdk.ethers.addProvider('fantom', 'https://rpc.ankr.com/fantom/');

  return sdk;
} 
