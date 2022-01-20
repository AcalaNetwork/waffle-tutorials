import {
  expect,
  use,
} from 'chai';
import {
  deployContract,
  solidity,
} from 'ethereum-waffle';
import { Contract } from 'ethers';

import {
  evmChai,
  Signer,
  TestProvider,
} from '@acala-network/bodhi';

import HelloWorld from '../build/HelloWorld.json';
import { getTestProvider } from "../utils/setup"

use(solidity);
use(evmChai);

describe("HelloWorld", () => {
  let provider: TestProvider;
  let wallet: Signer;
  let instance: Contract;

  before(async () => {
    provider = await getTestProvider();
    [wallet] = await provider.getWallets();
    instance = await deployContract(wallet, HelloWorld);
  });

  after(async () => {
    provider.api.disconnect();
  });

  it("returns the right value after the contract is deployed", async () => {
    console.log(instance.address);
    expect(await instance.helloWorld()).to.equal("Hello World!");
  });
});