import { utils } from 'ethers';
import CollectionConfig from './CollectionConfig';

// Update the following array if you change the constructor arguments...
export const KiteContractArguments = [
    CollectionConfig.builderContract,
    CollectionConfig.tokenName,
    CollectionConfig.tokenSymbol,
    utils.parseEther(CollectionConfig.whitelistSale.price.toString()),
    CollectionConfig.whitelistSale.maxMintAmountPerTx,
    CollectionConfig.freeMaxMintAmountPerTx,
    CollectionConfig.maxSupply,
    CollectionConfig.publicSale.maxMintAmountPerTx,
    CollectionConfig.hiddenMetadataUri,
    CollectionConfig.trustedForwarder
] as const;

export const ComponentContractArguments = [
    CollectionConfig.builderContract,
    CollectionConfig.kiteContractAddress,
    CollectionConfig.componentMetadataUri,
    CollectionConfig.componentName,
    CollectionConfig.trustedForwarder,
] as const;

export const KiteBuilderContractArguments = [
    CollectionConfig.admin
] as const;
