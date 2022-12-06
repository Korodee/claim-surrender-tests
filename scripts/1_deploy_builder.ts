import { ethers } from 'hardhat';
import {BuilderContractType} from '../lib/NftContractProvider';
import { KiteBuilderContractArguments } from '../config/ContractArguments';

async function main() {
  // We get the contract to deploy
  const Contract = await ethers.getContractFactory("KiteBuilder");
  // @ts-ignore
  const contract = await Contract.deploy(...KiteBuilderContractArguments) as BuilderContractType;

  await contract.deployed();

  console.log('Builder Contract deployed to:', contract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
