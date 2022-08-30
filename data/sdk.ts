import { CryptoStatsSDK } from "@cryptostats/sdk";

export function getSDK() {
  const sdk = new CryptoStatsSDK({
    mongoConnectionString: process.env.MONGO_CONNECTION_STRING,
    redisConnectionString: process.env.REDIS_URL,
  });

  sdk
    .getCollection('bridged-value')
    .setCacheKeyResolver((_id: string, query: string, params: string[]) =>
      query === 'currentValueLocked' ? Math.floor(Date.now() / 1000 / 60 / 60).toString() : null
    );

    if (process.env.ALCHEMY_ETH_KEY) {
    const rpc = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_ETH_KEY}`
    sdk.ethers.addProvider('ethereum', rpc, { archive: true });
  } else {
    console.error('Alchemy key not set');
  }

  return sdk;
}