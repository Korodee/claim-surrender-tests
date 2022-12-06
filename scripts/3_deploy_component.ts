import { ethers } from 'hardhat';
import { ComponentContractType } from '../lib/NftContractProvider';
import { ComponentContractArguments } from '../config/ContractArguments';

async function main() {
  // We get the contract to deploy
  const Contract = await ethers.getContractFactory("KiteComponent");
  // @ts-ignore
  const contract = await Contract.deploy(...ComponentContractArguments) as ComponentContractType;

  await contract.deployed();

  console.log('Component Contract deployed to:', contract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
