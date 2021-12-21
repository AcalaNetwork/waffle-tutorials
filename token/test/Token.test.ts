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
import { WsProvider } from '@polkadot/api';

import { getTestProvider } from '../../utils';
import Token from '../build/Token.json';

use(solidity);
use(evmChai);

const provider = getTestProvider();


// const provider = new MockProvider();

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("Token", () => {
    let deployer: Signer;
    let user: Signer;
    let instance: Contract;
    let deployerAddress: String;
    let userAddress: String;

    before(async () => {
      [deployer, user] = await provider.getWallets();
      instance = await deployContract(deployer, Token, [1234567890]);
      deployerAddress = await deployer.getAddress();
      userAddress = await user.getAddress();
    });

    after(async () => {
      provider.api.disconnect();
    });

    describe("Deployment", () => {
      it("should assing correct name to Token", async () => {
        expect(await instance.name()).to.equal("Token");
      });

      it("should assign correct symbol", async () => {
        expect(await instance.symbol()).to.equal("TKN");
      });

      it("should assign correct total supply", async () => {
        expect((await instance.totalSupply()).toNumber()).to.equal(1234567890);
      });

      it("should assign appropriate balance to the deployer", async () => {
        expect((await instance.balanceOf(deployerAddress)).toNumber()).to.equal(1234567890);
      });

      it("should not assign balance to a random address", async () => {
        expect((await instance.balanceOf(userAddress)).toNumber()).to.equal(0);
      });

      it("should set the allowances to 0", async () => {
        expect((await instance.allowance(deployerAddress, userAddress)).toNumber()).to.equal(0);
      });
    });

    describe("Operation", () => {
      describe("Transfer", () => {
        describe("transfer()", () => {
          it("should update balances", async () => {
            const initialUserBalance = await instance.balanceOf(userAddress);
            const initialDeployerBalance = await instance.balanceOf(deployerAddress);

            await instance.connect(deployer).transfer(userAddress, 500);

            const finalUserBalance = await instance.balanceOf(userAddress);
            const finalDeployerBalance = await instance.balanceOf(deployerAddress);

            expect(initialDeployerBalance.toNumber() - finalDeployerBalance.toNumber()).to.equal(500);
            expect(finalUserBalance.toNumber() - initialUserBalance.toNumber()).to.equal(500);
          });

          it("should emit Transfer event", async () => {
            await expect(instance.connect(deployer).transfer(userAddress, 500)).to
              .emit(instance, "Transfer")
              .withArgs(deployerAddress, userAddress, 500);
          });

          it("should revert when trying to transfer to 0x0 address", async () => {
            await expect(instance.connect(deployer).transfer(NULL_ADDRESS, 500)).to
              .be.revertedWith("ERC20: transfer to the zero address");
          });

          it("should revert when trying to transfer more than own balance", async () => {
            await expect(instance.connect(user).transfer(deployerAddress, 1234567890)).to
              .be.revertedWith("ERC20: transfer amount exceeds balance");
          });
        });
      });

      describe("Allowances", () => {
        describe("approve()", () => {
          it("should grant allowance for an amount smaller than own balance", async () => {
            await instance.connect(deployer).approve(userAddress, 1500);

            const allowance = await instance.allowance(deployerAddress, userAddress);

            expect(allowance.toNumber()).to.equal(1500);
          });

          it("should grant allowance for an amount greater than own balance", async () => {
            await instance.connect(deployer).approve(userAddress, 12345678900);

            const allowance = await instance.allowance(deployerAddress, userAddress);

            expect(allowance.toNumber()).to.equal(12345678900);
          });

          it("should emit Approval", async () => {
            await expect(instance.connect(deployer).approve(userAddress, 1500)).to
              .emit(instance, "Approval")
              .withArgs(deployerAddress, userAddress, 1500);
          });

          it("should revert when trying to grant allowance to 0x0 address", async () => {
            await expect(instance.connect(deployer).approve(NULL_ADDRESS, 1500)).to
              .be.revertedWith("ERC20: approve to the zero address");
          });
        });

        describe("increaseAllowance()", () => {
          it("should increase allowance for a total amount lower than own balance", async () => {
            await instance.connect(deployer).approve(userAddress, 1000);

            const initialAllowance = await instance.allowance(deployerAddress, userAddress);

            await instance.connect(deployer).increaseAllowance(userAddress, 500);

            const finalAllowance = await instance.allowance(deployerAddress, userAddress);

            expect(finalAllowance.toNumber() - initialAllowance.toNumber()).to.equal(500);
          });

          it("should increase allowance for a total amount higher than own balance", async () => {
            await instance.connect(deployer).approve(userAddress, 1000);

            const initialAllowance = await instance.allowance(deployerAddress, userAddress);

            await instance.connect(deployer).increaseAllowance(userAddress, 1234567890);

            const finalAllowance = await instance.allowance(deployerAddress, userAddress);

            expect(finalAllowance.toNumber() - initialAllowance.toNumber()).to.equal(1234567890);
          });

          it("should emit Approval event", async () => {
            await instance.connect(deployer).approve(userAddress, 1000);

            await expect(instance.connect(deployer).increaseAllowance(userAddress, 500)).to
              .emit(instance, "Approval")
              .withArgs(deployerAddress, userAddress, 1500);
          });

          it("should increase the allowance even if there is no preeexisting allowance", async () => {
            const initialAllowance = await instance.allowance(deployerAddress, userAddress);

            await instance.connect(deployer).increaseAllowance(userAddress, 500);

            const finalAllowance = await instance.allowance(deployerAddress, userAddress);

            expect(finalAllowance.toNumber() - initialAllowance.toNumber()).to.equal(500);
          });
        });

        describe("decreaseAllowance()", () => {
          it("should allow owner to decrease alowance", async () => {
            await instance.connect(deployer).approve(userAddress, 1500);

            const initialAllowance = await instance.allowance(deployerAddress, userAddress);

            await instance.connect(deployer).decreaseAllowance(userAddress, 500);

            const finalAllowance = await instance.allowance(deployerAddress, userAddress);

            expect(initialAllowance.toNumber() - finalAllowance.toNumber()).to.equal(500);
          });

          it("should emit Approval event", async () => {
            await instance.connect(deployer).approve(userAddress, 1500);

            await expect(instance.connect(deployer).decreaseAllowance(userAddress, 500)).to
              .emit(instance, "Approval")
              .withArgs(deployerAddress, userAddress, 1000);
          });

          it("should revert when trying to reduce the allowance below 0", async () => {
            await expect(instance.connect(deployer).decreaseAllowance(userAddress, 10000)).to
              .be.revertedWith("ERC20: decreased allowance below zero");
          });
        });

        describe("transferFrom()", () => {
          it("should allow transfer if the allowance is given", async () => {
            await instance.connect(deployer).approve(userAddress, 1500);

            const initialBalance = await instance.balanceOf(userAddress);

            await instance.connect(user).transferFrom(deployerAddress, userAddress, 500);

            const finalBalance = await instance.balanceOf(userAddress);

            expect(finalBalance.toNumber() - initialBalance.toNumber()).to.equal(500);
          });

          it("should emit Transfer", async () => {
            await instance.connect(deployer).approve(userAddress, 1500);

            await expect(instance.connect(user).transferFrom(deployerAddress, userAddress, 500)).to
              .emit(instance, "Transfer")
              .withArgs(deployerAddress, userAddress, 500);
          });

          it("should emit Approval", async () => {
            await instance.connect(deployer).approve(userAddress, 1500);

            await expect(instance.connect(user).transferFrom(deployerAddress, userAddress, 500)).to
              .emit(instance, "Approval")
              .withArgs(deployerAddress, userAddress, 1000);
          });

          it("should update allowance", async () => {
            await instance.connect(deployer).approve(userAddress, 1500);

            const initialAllowance = await instance.allowance(deployerAddress, userAddress);

            await instance.connect(user).transferFrom(deployerAddress, userAddress, 500);

            const finalAllowance = await instance.allowance(deployerAddress, userAddress);

            expect(initialAllowance.toNumber() - finalAllowance.toNumber()).to.equal(500);
          });

          it("should revert when trying to transfer amount higher than allowance", async () => {
            await instance.connect(deployer).approve(userAddress, 1500);

            await expect(instance.connect(user).transferFrom(deployerAddress, userAddress, 100000)).to
              .be.revertedWith("ERC20: transfer amount exceeds allowance");
          });

          it("should rever when trying to transfer to 0x0 address", async () => {
            await instance.connect(deployer).approve(userAddress, 1500);

            await expect(instance.connect(user).transferFrom(deployerAddress, NULL_ADDRESS, 500)).to
              .be.revertedWith("ERC20: transfer to the zero address");
          });

          it("should revert when owner doesn't have enough funds", async () => {
            await instance.connect(deployer).approve(userAddress, 12345678900);

            await expect(instance.connect(user).transferFrom(deployerAddress, userAddress, 12345678900)).to
              .be.revertedWith("ERC20: transfer amount exceeds balance");
          });

          it("should revert when allowance was not given", async () => {
            await expect(instance.connect(deployer).transferFrom(userAddress, deployerAddress, 1500)).to
              .be.revertedWith("ERC20: transfer amount exceeds allowance");
          });
        });
      });
    });
});