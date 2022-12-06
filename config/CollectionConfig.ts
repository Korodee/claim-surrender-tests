import CollectionConfigInterface from '../lib/CollectionConfigInterface';
import whitelistAddresses from './whitelist.json';

const CollectionConfig: CollectionConfigInterface = {
  tokenName: 'Kite',
  tokenSymbol: 'KITE',
  kiteName: 'KiteFighter',
  componentName: 'KiteComponent',
  builderName: 'KiteBuilder',
  componentMetadataUri: 'ipfs://QmZ5ev7yLZ91XuHTTNZiWCJ31SX5ruUoaymLJeSdBCU2Uj/{id}.json',
  builderContract: "0x965EED74B5cE72e82FF25809dc49Cb36e5f6B94d",
  hiddenMetadataUri: 'ipfs://QmXTnQM6acNcThLhwxssvRL6exDkkGGKoK2bNhozpr3jtV/',
  maxSupply: 5555,
  whitelistSale: {
    price: 0.04,
    maxMintAmountPerTx: 2,
  },
  freeMaxMintAmountPerTx: 2,
  publicSale: {
    price: 0.04,
    maxMintAmountPerTx: 2,
  },
  kiteContractAddress: "0x965EED74B5cE72e82FF25809dc49Cb36e5f6B94d",
  componentContractAddress: "0x965EED74B5cE72e82FF25809dc49Cb36e5f6B94d",
  admin: "0x965EED74B5cE72e82FF25809dc49Cb36e5f6B94d",
  whitelistAddresses: whitelistAddresses,
  trustedForwarder: "0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b"
};

export default CollectionConfig;
