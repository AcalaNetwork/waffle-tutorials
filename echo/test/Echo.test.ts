import {
  expect,
  use,
} from 'chai';
import {
  deployContract,
  solidity,
} from 'ethereum-waffle';
import {
  Contract,
  ethers,
} from 'ethers';

import {
  evmChai,
  Signer,
} from '@acala-network/bodhi';

import { getTestProvider } from '../../utils';
import Echo from '../build/Echo.json';

use(solidity);
use(evmChai);

const provider = getTestProvider();

const ECHO_ABI = require("../build/Echo.json").abi;

describe("Echo", () => {
    let wallet: Signer;
    let instance: Contract;

    before(async () => {
      [wallet] = await provider.getWallets();
      instance = await deployContract(wallet, Echo);
    });

    after(async () => {
      provider.api.disconnect();
    });

    describe("Deployment", () => {
      it("returns the right value after the contract is deployed", async () => {
        console.log(instance.address);
        expect(await instance.echo()).to.equal("Deployed successfully!");
      });
    });

    describe("Operation", () => {
      it("should update the echo variable", async () => {
        await instance.scream("Hello World!");

        expect(await instance.echo()).to.equal("Hello World!");
      });

      it("should emit a NewEcho event", async () => {
        await expect(instance.scream("Hello World!")).to
          .emit(instance, "NewEcho");
      });

      it("should increment echo counter in the NewEcho event", async function () {
        let iface = new ethers.utils.Interface(ECHO_ABI);

        let current_block_number = Number(await provider.api.query.system.number());
        await instance.scream("Hello World!");

        let block_hash = await provider.api.rpc.chain.getBlockHash(current_block_number + 1);
        const data = await provider.api.derive.tx.events(block_hash);

        let event = data.events.filter(item => provider.api.events.evm.Executed.is(item.event));
        expect(event.length).above(0);

        let decode_log = iface.parseLog((event[event.length-1].event.data.toJSON() as any)[2][0]);

        const initialCount = decode_log.args.count;

        await expect(instance.scream("Goodbye World!")).to
          .emit(instance, "NewEcho")
          .withArgs("Goodbye World!", initialCount.toNumber() + 1);
      });
    });
});