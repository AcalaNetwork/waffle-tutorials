import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { Contract } from 'ethers';
import ADDRESS from "@acala-network/contracts/utils/Address"

import { evmChai, Signer, TestProvider } from '@acala-network/bodhi';
import { WsProvider } from '@polkadot/api';

const Token = require('@acala-network/contracts/build/contracts/Token.json');

use(solidity);
use(evmChai);

const provider = new TestProvider({
  provider: new WsProvider("ws://127.0.0.1:9944"),
});

describe("PrecompiledToken", () => {
    let deployer: Signer;
    let instance: Contract;
    let deployerAddress: String;

    before(async () => {
      [deployer] = await provider.getWallets();
      instance = new Contract(ADDRESS.ACA, Token.abi, deployer);
      deployerAddress = await deployer.getAddress();
    });

    after(async () => {
      provider.api.disconnect();
    });

    describe("Precompiled token", () => {
      it("should assing correct name to Token", async () => {
        expect(await instance.name()).to.equal("Acala");
      });

      it("should assign correct symbol", async () => {
        expect(await instance.symbol()).to.equal("ACA");
      });

      it("should have the total supply greater than 0", async () => {
        expect((await instance.totalSupply())).to.be.above(0);
      });

      it("should show balance of the deployer address higher than 0", async () => {
        expect((await instance.balanceOf(deployerAddress))).to.be.above(0);
      });
    });
});