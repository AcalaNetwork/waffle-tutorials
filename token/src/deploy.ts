import { use } from 'chai';
import { ContractFactory } from 'ethers';

import { evmChai } from '@acala-network/bodhi';

import Token from '../build/Token.json';
import { setup } from '../utils/setup';

use(evmChai);

const main = async () => {
    const { wallet, provider } = await setup();

    console.log('Deploy Token');

    const instance = await ContractFactory.fromSolidity(Token).connect(wallet).deploy(1234567890);

    console.log("Token address:", instance.address);

    const name = await instance.name();
    const symbol = await instance.symbol();
    const totalSupply = await instance.totalSupply();

    console.log("Token name:", name);
    console.log("Token symbol:", symbol);
    console.log("Token total supply:", totalSupply.toNumber());

    provider.api.disconnect();
}

main()
