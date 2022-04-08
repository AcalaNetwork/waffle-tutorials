import { use } from 'chai';
import { ContractFactory } from 'ethers';

import { evmChai } from '@acala-network/bodhi';

import Echo from '../build/Echo.json';
import { setup } from '../utils/setup';

use(evmChai);

const main = async () => {
  const { wallet, provider } = await setup();

  console.log('Deploy Echo');

  const instance = await ContractFactory.fromSolidity(Echo).connect(wallet).deploy();

  console.log('Echo address:', instance.address);

  const variable = await instance.echo();

  console.log('Deployment status:', variable);

  await instance.scream('Ready for use!');

  const ready = await instance.echo();

  console.log('Contract status:', ready);

  provider.api.disconnect();
};

main();
