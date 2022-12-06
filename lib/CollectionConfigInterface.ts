interface SaleConfig {
  price: number;
  maxMintAmountPerTx: number;
}

export default interface CollectionConfigInterface {
  tokenName: string;
  tokenSymbol: string;
  kiteName: string;
  builderName: string;
  componentName: string;
  componentMetadataUri: string;
  builderContract: string;
  hiddenMetadataUri: string;
  maxSupply: number;
  freeMaxMintAmountPerTx: number;
  whitelistSale: SaleConfig;
  publicSale: SaleConfig;
  kiteContractAddress: string;
  componentContractAddress: string;
  admin: string;
  whitelistAddresses: string[];
  trustedForwarder: string
};