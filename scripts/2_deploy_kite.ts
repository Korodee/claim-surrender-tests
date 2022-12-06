import { ethers } from 'hardhat';
import {KiteContractType} from '../lib/NftContractProvider';
import {KiteContractArguments} from '../config/ContractArguments';

async function main() {
  // We get the contract to deploy
  const Contract = await ethers.getContractFactory("KiteFighter");
  // @ts-ignore
  const contract = await Contract.deploy(...KiteContractArguments) as KiteContractType;

  await contract.deployed();

  console.log('Kite Contract deployed to:', contract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
