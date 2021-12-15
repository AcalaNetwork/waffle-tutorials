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

import NFT from '../build/NFT.json';

use(solidity);
use(evmChai);

const provider = new TestProvider({
  provider: new WsProvider("ws://127.0.0.1:9944"),
});

// const provider = new MockProvider();

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("NFT", () => {
    let deployer: Signer;
    let user: Signer;
    let instance: Contract;
    let deployerAddress: String;
    let userAddress: String;

    beforeEach(async () => {
      [deployer, user] = await provider.getWallets();
      instance = await deployContract(deployer, NFT);
      deployerAddress = await deployer.getAddress();
      userAddress = await user.getAddress();
    });

    after(async () => {
      provider.api.disconnect();
    });

    describe("Deployment", () => {
      it("should set the correct NFT name", async () => {
        expect(await instance.name()).to.equal("Example non-fungible token");
      });

      it("should set the correct NFT symbol", async () => {
        expect(await instance.symbol()).to.equal("eNFT");
      });

      it("should assign the initial balance of the deployer", async () => {
        expect((await instance.balanceOf(deployerAddress)).toNumber()).to.equal(0);
      });

      it("should revert when trying to get the balance of the 0x0 address", async () => {
        await expect(instance.balanceOf(NULL_ADDRESS)).to
          .revertedWith("ERC721: balance query for the zero address");
      });
    });

    describe("Operation", () => {
      describe("minting", () => {
        it("should emit Transfer event", async () => {
          await expect(instance.connect(deployer).mintNFT(userAddress, "testToken")).to
            .emit(instance, "Transfer")
            .withArgs(NULL_ADDRESS, userAddress, 1);
        });

        it("should mint token to an address", async () => {
          const initialBalance = await instance.balanceOf(userAddress);

          await instance.connect(deployer).mintNFT(userAddress, "");

          const finalBalance = await instance.balanceOf(userAddress);

          expect(finalBalance.toNumber() - initialBalance.toNumber()).to.equal(1);
        });

        it("should set the expected base URI", async () => {
          await instance.connect(deployer).mintNFT(userAddress, "");

          expect(await instance.tokenURI(1)).to.equal("acala-evm+-tutorial-nft/1")
        });

        it("should set the expected URI", async () => {
          await instance.connect(deployer).mintNFT(userAddress, "amazing-token");

          expect(await instance.tokenURI(1)).to.equal("acala-evm+-tutorial-nft/amazing-token")
        });

        it("should allow user to own multiple tokens", async () => {
          const initialBalance = await instance.balanceOf(userAddress);

          await instance.connect(deployer).mintNFT(userAddress, "");
          await instance.connect(deployer).mintNFT(userAddress, "");

          const finalBalance = await instance.balanceOf(userAddress);

          expect(finalBalance.toNumber() - initialBalance.toNumber()).to.equal(2);
        });

        it("should revert when trying to get an URI of an nonexistent token", async () => {
          await expect(instance.tokenURI(42)).to
            .be.revertedWith("ERC721URIStorage: URI query for nonexistent token");
        });
      });

      describe("balances and ownerships", () => {
        it("should revert when trying to get balance of 0x0 address", async () => {
          await expect(instance.balanceOf(NULL_ADDRESS)).to
            .be.revertedWith("ERC721: balance query for the zero address");
        });

        it("should revert when trying to get the owner of a nonexistent token", async () => {
          await expect(instance.ownerOf(42)).to
            .be.revertedWith("ERC721: owner query for nonexistent token");
        });

        it("should return the token owner", async () => {
          await instance.connect(deployer).mintNFT(userAddress, "");

          const owner = await instance.ownerOf(1);

          expect(owner).to.equal(userAddress);
        });
      });

      describe("approvals", () => {
        it("should grant an approval", async () => {
          await instance.connect(deployer).mintNFT(userAddress, "");
          await instance.connect(user).approve(deployerAddress, 1);

          const approved = await instance.getApproved(1);

          expect(approved).to.equal(deployerAddress);
        });
        
        it("should emit Approval event when granting approval", async () => {
          await instance.connect(deployer).mintNFT(userAddress, "");

          await expect(instance.connect(user).approve(deployerAddress, 1)).to
            .emit(instance, "Approval")
            .withArgs(userAddress, deployerAddress, 1);
        });
        
        it("should revert when trying to set token approval to self", async () => {
          await instance.connect(deployer).mintNFT(userAddress, "");

          await expect(instance.connect(user).approve(userAddress, 1)).to
            .be.revertedWith("ERC721: approval to current owner");
        });
        
        it("should revert when trying to grant approval for a token that is someone else's", async () => {
          await instance.connect(deployer).mintNFT(userAddress, "");

          await expect(instance.connect(deployer).approve(deployerAddress, 1)).to
            .be.revertedWith("ERC721: approve caller is not owner nor approved for all");
        });
        
        it("should revert when trying to get an approval of a nonexistent token", async () => {
          await expect(instance.getApproved(42)).to
            .be.revertedWith("ERC721: approved query for nonexistent token")
        });
        
        it("should return 0x0 address as approved for a token for which no approval is given", async () => {
          await instance.connect(deployer).mintNFT(userAddress, "");

          const approved = await instance.getApproved(1);

          expect(approved).to.equal(NULL_ADDRESS);
        });
        
        it("sets approval for all", async () => {
          await instance.connect(user).setApprovalForAll(deployerAddress, true);

          const approved = await instance.isApprovedForAll(userAddress, deployerAddress);

          expect(approved).to.be.true;
        });
        
        it("revokes approval for all", async () => {
          await instance.connect(user).setApprovalForAll(deployerAddress, true);
          await instance.connect(user).setApprovalForAll(deployerAddress, false);

          const approved = await instance.isApprovedForAll(userAddress, deployerAddress);

          expect(approved).to.be.false;
        });
        
        it("doesn't reflect operator approval in single token approval", async () => {
          await instance.connect(deployer).mintNFT(userAddress, "");
          await instance.connect(user).setApprovalForAll(deployerAddress, true);

          const approved = await instance.getApproved(1);

          expect(approved).to.equal(NULL_ADDRESS);
        });
        
        it("should allow operator to grant allowance for a apecific token", async () => {
          await instance.connect(deployer).mintNFT(userAddress, "");
          await instance.connect(user).setApprovalForAll(deployerAddress, true);

          await instance.connect(deployer).approve(deployerAddress, 1);

          const approval = await instance.getApproved(1);

          expect(approval).to.equal(deployerAddress);
        });
        
        it("should emit Approval event when operator grants approval", async () => {
          await instance.connect(deployer).mintNFT(userAddress, "");
          await instance.connect(user).setApprovalForAll(deployerAddress, true);

          await expect(instance.connect(deployer).approve(deployerAddress, 1)).to
            .emit(instance, "Approval")
            .withArgs(userAddress, deployerAddress, 1);
        });
        
        it("should emit ApprovalForAll event when approving for all", async () => {
          await expect(instance.connect(user).setApprovalForAll(deployerAddress, true)).to
            .emit(instance, "ApprovalForAll")
            .withArgs(userAddress, deployerAddress, true);
        });
        
        it("should emit ApprovalForAll event when revoking approval for all", async () => {
          await instance.connect(user).setApprovalForAll(deployerAddress, true);

          await expect(instance.connect(user).setApprovalForAll(deployerAddress, false)).to
            .emit(instance, "ApprovalForAll")
            .withArgs(userAddress, deployerAddress, false);
        });
      });

      describe("transfers", () => {
        it("should transfer the token", async () => {
          await instance.connect(deployer).mintNFT(userAddress, "");

          const initialBalance = await instance.balanceOf(deployerAddress);

          await instance.connect(user).transferFrom(userAddress, deployerAddress, 1);

          const finalBalance = await instance.balanceOf(deployerAddress);

          expect(finalBalance.toNumber() - initialBalance.toNumber()).to.equal(1);
        });
        
        it("should emit Transfer event", async () => {
          await instance.connect(deployer).mintNFT(userAddress, "");

          await expect(instance.connect(user).transferFrom(userAddress, deployerAddress, 1)).to
            .emit(instance, "Transfer")
            .withArgs(userAddress, deployerAddress, 1);
        });
        
        it("should allow transfer of the tokens if the allowance is given", async () => {
          await instance.connect(deployer).mintNFT(userAddress, "");
          await instance.connect(user).approve(deployerAddress, 1);

          const initialBalance = await instance.balanceOf(deployerAddress);

          await instance.connect(deployer).transferFrom(userAddress, deployerAddress, 1);

          const finalBalance = await instance.balanceOf(deployerAddress);

          expect(finalBalance.toNumber() - initialBalance.toNumber()).to.equal(1);
        });
        
        it("should reset the allowance after the token is transferred", async () => {
          await instance.connect(deployer).mintNFT(userAddress, "");
          await instance.connect(user).approve(deployerAddress, 1);

          await instance.connect(deployer).transferFrom(userAddress, deployerAddress, 1);

          const approved = await instance.getApproved(1);

          expect(approved).to.equal(NULL_ADDRESS);
        });
      });
    });
});