import { use } from 'chai';
import { ContractFactory } from 'ethers';

import { evmChai } from '@acala-network/bodhi';

import NFT from '../build/NFT.json';
import { setup } from '../utils/setup';

use(evmChai);

const main = async () => {
    const { wallet, provider } = await setup();

    console.log('Deploy NFT');

    const instance = await ContractFactory.fromSolidity(NFT).connect(wallet).deploy();

    console.log("NFT address:", instance.address);

    const name = await instance.name();
    const symbol = await instance.symbol();

    await instance.mintNFT(await wallet.getAddress(), "exclusive-first-token");

    const URI = await instance.tokenURI(1);

    console.log("NFT name:", name);
    console.log("NFT symbol:", symbol);
    console.log("Minted NFT URI:", URI);

    provider.api.disconnect();
}

main()
