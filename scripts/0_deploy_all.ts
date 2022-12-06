import { ethers } from 'hardhat';
import {BuilderContractType, ComponentContractType, KiteContractType} from '../lib/NftContractProvider';
import {
  ComponentContractArguments,
  KiteBuilderContractArguments,
  KiteContractArguments
} from '../config/ContractArguments';
import CollectionConfig from "../config/CollectionConfig";

async function main() {
  // We get the contract to deploy
  const BuilderContract = await ethers.getContractFactory("KiteBuilder");
  // @ts-ignore
  const builderContract = await BuilderContract.deploy(...KiteBuilderContractArguments) as BuilderContractType;
  await builderContract.deployed();

  console.log('Builder Contract deployed to:', builderContract.address);
  CollectionConfig.builderContract = builderContract.address;

  const KiteContract = await ethers.getContractFactory("KiteFighter");
  // @ts-ignore
  const kiteContract = await KiteContract.deploy(builderContract.address, ...KiteContractArguments.slice(1)) as KiteContractType;
  await kiteContract.deployed();

  console.log('Kite Contract deployed to:', kiteContract.address);
  CollectionConfig.kiteContractAddress = kiteContract.address;

  const ComponentContract = await ethers.getContractFactory("KiteComponent");
  // @ts-ignore
  const componentContract = await ComponentContract.deploy(builderContract.address, kiteContract.address, ...ComponentContractArguments.slice(2)) as ComponentContractType;
  await componentContract.deployed();

  console.log('Component Contract deployed to:', componentContract.address);
  CollectionConfig.componentContractAddress = componentContract.address;
  console.log("Don't forget to update Collection Config to use the deployed contract address");

  await (await builderContract.setContractAddresses(kiteContract.address, componentContract.address)).wait();

  console.log("Ready to go !");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
