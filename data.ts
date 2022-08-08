interface IBridge {
  name: string;
}

const BRIDGES: IBridge[] = [{ name: 'wormhole' }];

interface IChain {
  name: string;
}

const CHAINS: IChain[] = [{ name: 'ethereum' }];

export { BRIDGES, CHAINS };
