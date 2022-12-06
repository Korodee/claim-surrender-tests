import {
  KiteComponent as CContractType,
  KiteFighter as KContractType,
  KiteBuilder as BContractType,
    KiteFighterMock as KMContractType,
    KiteComponentMock as CMContractType,
} from '../typechain/index';

import { ethers } from 'hardhat';
import CollectionConfig from './../config/CollectionConfig';

export class NftComponentContractProvider {
  public static async getContract(): Promise<CContractType> {
    // Check configuration
    if (null === CollectionConfig.componentContractAddress) {
      throw '\x1b[31merror\x1b[0m ' + 'Please add the contract address to the configuration before running this command.';
    }

    if (await ethers.provider.getCode(CollectionConfig.componentContractAddress) === '0x') {
      throw '\x1b[31merror\x1b[0m ' + `Can't find a contract deployed to the target address: ${CollectionConfig.componentContractAddress}`;
    }

    return await ethers.getContractAt(CollectionConfig.componentName, CollectionConfig.componentContractAddress) as CContractType;
  }
}

export class NftKiteContractProvider {
  public static async getContract(): Promise<KContractType> {
    // Check configuration
    if (null === CollectionConfig.kiteContractAddress) {
      throw '\x1b[31merror\x1b[0m ' + 'Please add the contract address to the configuration before running this command.';
    }

    if (await ethers.provider.getCode(CollectionConfig.kiteContractAddress) === '0x') {
      throw '\x1b[31merror\x1b[0m ' + `Can't find a contract deployed to the target address: ${CollectionConfig.kiteContractAddress}`;
    }

    return await ethers.getContractAt(CollectionConfig.kiteName, CollectionConfig.kiteContractAddress) as KContractType;
  }
}

export class BuilderContractProvider {
  public static async getContract(): Promise<BContractType> {
    // Check configuration
    if (null === CollectionConfig.builderContract) {
      throw '\x1b[31merror\x1b[0m ' + 'Please add the contract address to the configuration before running this command.';
    }

    if (await ethers.provider.getCode(CollectionConfig.builderContract) === '0x') {
      throw '\x1b[31merror\x1b[0m ' + `Can't find a contract deployed to the target address: ${CollectionConfig.builderContract}`;
    }

    return await ethers.getContractAt(CollectionConfig.builderName, CollectionConfig.builderContract) as BContractType;
  }
}

export type ComponentContractType = CContractType;
export type KiteContractType = KContractType;
export type BuilderContractType = BContractType;

export type KiteMockContractType = KMContractType;
export type ComponentMockContractType = CMContractType;
