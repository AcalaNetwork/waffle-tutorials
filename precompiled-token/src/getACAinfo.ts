import { use } from 'chai';
import { Contract } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import ADDRESS from '@acala-network/contracts/utils/Address';

import { evmChai } from '@acala-network/bodhi';

import Token from '@acala-network/contracts/build/contracts/Token.json';
import { setup } from '../utils/setup';

use(evmChai);

const main = async () => {
  const { wallet, provider } = await setup();

  console.log('Retrieve predeployed token information');

  const instance = new Contract(ADDRESS.ACA, Token.abi, wallet);

  console.log('Token address:', instance.address);

  const name = await instance.name();
  const symbol = await instance.symbol();
  const decimals = await instance.decimals();
  const totalSupply = await instance.totalSupply();

  const walletAddress = await wallet.getAddress();

  const balance = await instance.balanceOf(await wallet.getAddress());

  console.log('Token name:', name);
  console.log('Token symbol:', symbol);
  console.log('Token decimal spaces:', decimals);
  console.log('Token total supply:', totalSupply.toString());
  console.log('Token balance of %s is: %s', walletAddress, balance.toString());

  console.log(
    'Formatted total supply of %s token is: %s %s',
    name,
    formatUnits(totalSupply.toString(), decimals),
    symbol
  );
  console.log(
    'Formatted %s token balance of %s is: %s %s',
    name,
    walletAddress,
    formatUnits(balance.toString(), decimals),
    symbol
  );

  provider.api.disconnect();
};

main();
