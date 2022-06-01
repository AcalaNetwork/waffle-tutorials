import { TestProvider, AccountSigningKey, Provider, Signer } from '@acala-network/bodhi';
import { WsProvider, Keyring } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { ApiOptions } from '@polkadot/api/types';
import { createTestPairs } from '@polkadot/keyring/testingPairs';

const WS_URL = process.env.WS_URL || 'ws://127.0.0.1:9944';

export const getTestProvider = async (urlOverwrite?: string, opts?: ApiOptions): Promise<TestProvider> => {
  const url = urlOverwrite || WS_URL;

  const provider = new TestProvider({
    provider: new WsProvider(url),
    ...opts
  });

  await provider.api.isReady;

  console.log(`Test provider is connected to ${url}`);

  return provider;
};

export const setup = async (urlOverwrite?: string) => {
  const url = urlOverwrite || WS_URL;
  const seed = process.env.SEED;

  const provider = new Provider({
    provider: new WsProvider(url)
  });

  await provider.api.isReady;

  console.log(`Provider is connected to ${url}`);

  let pair: KeyringPair;
  if (seed) {
    const keyring = new Keyring({ type: 'sr25519' });
    pair = keyring.addFromUri(seed);
  } else {
    const testPairs = createTestPairs();
    pair = testPairs.alice;
  }

  const signingKey = new AccountSigningKey(provider.api.registry);
  signingKey.addKeyringPair(pair);

  const wallet = new Signer(provider, pair.address, signingKey);

  return {
    wallet,
    provider,
    pair
  };
};
