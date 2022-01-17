import { use } from 'chai';
import { Contract } from 'ethers';
import ADDRESS from "@acala-network/contracts/utils/Address"

import { evmChai } from '@acala-network/bodhi';

const Token = require('@acala-network/contracts/build/contracts/Token.json');
import setup from './setup';

use(evmChai);

const main = async () => {
    const { wallet, provider } = await setup();

    console.log('Retrieve predeployed token information');

    const instance = new Contract(ADDRESS.ACA, Token.abi, wallet);

    console.log("Token address:", instance.address);

    const name = await instance.name();
    const symbol = await instance.symbol();
    const decimals = await instance.decimals();
    const totalSupply = await instance.totalSupply();
    
    const walletAddress = await wallet.getAddress();

    const balance = await instance.balanceOf(await wallet.getAddress());

    console.log("Token name:", name);
    console.log("Token symbol:", symbol);
    console.log("Token decimal spaces:", decimals);
    console.log("Token total supply:", totalSupply.toString());
    console.log("Token balance of %s is: %s", walletAddress, balance.toString());

    const formattedSupply = balanceFormatting(totalSupply.toString(), decimals);
    const formattedBalance = balanceFormatting(balance.toString(), decimals);

    console.log("Formatted total supply of %s token is: %s %s", name, formattedSupply, symbol);
    console.log("Formatted %s token balance of %s is: %s %s", name, walletAddress, formattedBalance, symbol);

    provider.api.disconnect();
}

function balanceFormatting (balance: string, decimals: number): string {
    let balanceLength = balance.length;
    let output = "";

    if(balanceLength > decimals){
        for(let i = 0; i < (balanceLength - decimals); i++){
            output += balance[i];
        }
        output += ".";
        for(let i = (balanceLength - decimals); i < balanceLength; i++){
            output += balance[i];
        }
    } else {
        output += "0."
        for(let i = 0; i < (decimals - balanceLength); i++){
            output += "0";
        }
        output += balance;
    }
    return output;
}

main()
