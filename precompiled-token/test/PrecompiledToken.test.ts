import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { Contract } from 'ethers';
import ADDRESS from '@acala-network/contracts/utils/MandalaAddress';

import { evmChai, Signer, TestProvider } from '@acala-network/bodhi';

import Token from '@acala-network/contracts/build/contracts/Token.json';
import { getTestProvider } from '../utils/setup';

use(solidity);
use(evmChai);

describe('PrecompiledToken', () => {
  let provider: TestProvider;
  let deployer: Signer;
  let instance: Contract;
  let deployerAddress: String;

  before(async () => {
    provider = await getTestProvider();
    [deployer] = await provider.getWallets();
    instance = new Contract(ADDRESS.ACA, Token.abi, deployer);
    deployerAddress = await deployer.getAddress();
  });

  after(async () => {
    provider.api.disconnect();
  });

  describe('Precompiled token', () => {
    it('should assing correct name to Token', async () => {
      expect(await instance.name()).to.equal('Acala');
    });

    it('should assign correct symbol', async () => {
      expect(await instance.symbol()).to.equal('ACA');
    });

    it('should have the total supply greater than 0', async () => {
      expect(await instance.totalSupply()).to.be.above(0);
    });

    it('should show balance of the deployer address higher than 0', async () => {
      expect(await instance.balanceOf(deployerAddress)).to.be.above(0);
    });
  });
});
