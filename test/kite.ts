import { expect } from 'chai';
import { utils } from 'ethers';
import { ethers } from 'hardhat';
import CollectionConfig from './../config/CollectionConfig';
import {KiteContractArguments, ComponentContractArguments} from '../config/ContractArguments';
import {KiteContractType} from '../lib/NftContractProvider';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import collectionConfig from "./../config/CollectionConfig";
import keccak256 from "keccak256";
import {MerkleTree} from "merkletreejs";

enum SaleType {
    WHITELIST = CollectionConfig.whitelistSale.price,
    PUBLIC_SALE = CollectionConfig.publicSale.price,
}

const freeAddresses = [
    // Hardhat test addresses for 1st whitelist merkle tree...
    "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",
    "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
    "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec",
    "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097",
    "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
    "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
    "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
    "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
    "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"
];

const whitelistAddresses = [
    // Hardhat test addresses for 1st whitelist merkle tree...
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
    "0xBcd4042DE499D14e55001CcbB24a551F3b954096"
];

function getPrice(saleType: SaleType, mintAmount: number) {
    return utils.parseEther(saleType.toString()).mul(mintAmount);
}

describe(CollectionConfig.kiteName, function () {
    let owner!: SignerWithAddress;
    let whitelistedUser!: SignerWithAddress;
    let freeUser!: SignerWithAddress;
    let holder!: SignerWithAddress;
    let holder2!: SignerWithAddress;
    let externalUser!: SignerWithAddress;
    let contract!: KiteContractType;
    let kiteContractAddress!: string;

    before(async function () {
        [owner, whitelistedUser, holder, holder2, externalUser,,,,,,,, freeUser] = await ethers.getSigners();
    });

    it('Contract deployment', async function () {
        const Contract = await ethers.getContractFactory(CollectionConfig.kiteName);
        const args = [
            CollectionConfig.builderContract,
            CollectionConfig.tokenName,
            CollectionConfig.tokenSymbol,
            utils.parseEther(CollectionConfig.whitelistSale.price.toString()),
            CollectionConfig.whitelistSale.maxMintAmountPerTx,
            CollectionConfig.freeMaxMintAmountPerTx,
            CollectionConfig.maxSupply,
            CollectionConfig.publicSale.maxMintAmountPerTx,
            CollectionConfig.hiddenMetadataUri,
            CollectionConfig.trustedForwarder,
        ]
        contract = await Contract.deploy(...args) as KiteContractType;

        await contract.deployed();
    });

    it('Check initial data', async function () {
        expect(await contract.name()).to.equal(CollectionConfig.tokenName);
        expect(await contract.trustedForwarder()).to.equal(CollectionConfig.trustedForwarder);
        expect(await contract.builderContract()).to.equal(CollectionConfig.builderContract);

        expect(await contract.symbol()).to.equal(CollectionConfig.tokenSymbol);
        expect(await contract.cost()).to.equal(getPrice(SaleType.WHITELIST, 1));
        expect(await contract.maxSupply()).to.equal(CollectionConfig.maxSupply);
        expect(await contract.maxMintAmount()).to.equal(CollectionConfig.whitelistSale.maxMintAmountPerTx);
        expect(await contract.maxMintAmountFree()).to.equal(CollectionConfig.freeMaxMintAmountPerTx);
        expect(await contract.uriPrefix()).to.equal(CollectionConfig.hiddenMetadataUri);

        expect(await contract.paused()).to.equal(true);
        expect(await contract.whitelistMintEnabled()).to.equal(false);
        expect(await contract.revealed()).to.equal(false);
        expect(await contract.genOneStarted()).to.equal(false);

        await expect(contract.tokenURI(1)).to.be.revertedWith('ERC721Metadata: URI query for nonexistent token');
    });

    it('Update Forwarder', async function () {
        const newForwarder = "0x3D1D6A62c588C1Ee23365AF623bdF306Eb47217A";
        await (await contract.connect(owner).setTrustedForwarder(newForwarder)).wait();
        expect(await contract.trustedForwarder()).to.equal(newForwarder);
    });

    it('Update BuilderContract', async function () {
        const newBuilder = "0x4b0112CbC558439c5724E7E7A2F8752035b17190";
        await (await contract.connect(owner).setBuilderContract(newBuilder)).wait();
        expect(await contract.builderContract()).to.equal(newBuilder);
    });

    it('Update URI', async function () {
        const newURI = "ipfs://QmZ5ev7yLZ91XuHTTNZiWCJ31SX5ruUoaymLJeSdBCU2Up/";
        await (await contract.connect(owner).setUriPrefix(newURI)).wait();
        expect(await contract.uriPrefix()).to.equal(newURI);
    });

    it('Owner only functions', async function () {
        await expect(contract.connect(externalUser).setUriPrefix("HACKED")).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).setUriSuffix("HACKED")).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).setMaxMintAmount(200)).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).mintGenOne(await externalUser.getAddress(), 'https://google.com')).to.be.revertedWith("Caller is not authorized to make the call");
        await expect(contract.connect(externalUser).setBuilderContract('0x4b0112CbC558439c5724E7E7A2F8752035b17190')).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).setTrustedForwarder('0x4b0112CbC558439c5724E7E7A2F8752035b17190')).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).setRevealed(true)).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).setCost(100000000000)).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).setPaused(true)).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).setGenOneStarted(true)).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).setMerkleRoot('0x0000000000000000000000000000000000000000000000000000000000000000')).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).setMerkleRootFree('0x0000000000000000000000000000000000000000000000000000000000000000')).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).setWhitelistMintEnabled(false)).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).withdraw()).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Whitelist sale', async function () {
        // Build MerkleTree
        const leafNodesFree = freeAddresses.map(addr => keccak256(addr));
        const merkleTreeFree = new MerkleTree(leafNodesFree, keccak256, { sortPairs: true });

        //WL
        const leafNodesWl1 = whitelistAddresses.map(addr => keccak256(addr));
        const merkleTreeWl1 = new MerkleTree(leafNodesWl1, keccak256, { sortPairs: true });
        const rootHash1 = merkleTreeWl1.getRoot();
        await (await contract.setMerkleRoot('0x' + rootHash1.toString('hex'))).wait();

        await contract.setWhitelistMintEnabled(true);

        //Testing for Wl User 1 *max mint of 1*
        await contract.connect(whitelistedUser).whitelistMint(
            CollectionConfig.whitelistSale.maxMintAmountPerTx,
            merkleTreeWl1.getHexProof(keccak256(await whitelistedUser.getAddress())),
            {value: getPrice(SaleType.WHITELIST, CollectionConfig.whitelistSale.maxMintAmountPerTx)},
        );
        // Trying to mint twice
        await expect(contract.connect(whitelistedUser).whitelistMint(
            1,
            merkleTreeWl1.getHexProof(keccak256(await whitelistedUser.getAddress())),
            {value: getPrice(SaleType.WHITELIST, 1)},
        )).to.be.revertedWith('Address already claimed!');



        // Sending proof as a WL 1 user from a WL 2 merkle tree
        await expect(contract.connect(freeUser).whitelistMint(
            1,
            merkleTreeFree.getHexProof(keccak256(await freeUser.getAddress())),
            {value: getPrice(SaleType.WHITELIST, 1)},
        )).to.be.revertedWith('Invalid proof!');



        // Sending an invalid proof
        await expect(contract.connect(holder).whitelistMint(
            1,
            merkleTreeWl1.getHexProof(keccak256(await holder.getAddress())),
            {value: getPrice(SaleType.WHITELIST, 1)},
        )).to.be.revertedWith('Invalid proof!');


        // Sending no proof at all
        await expect(contract.connect(holder).whitelistMint(
            1,
            [],
            {value: getPrice(SaleType.WHITELIST, 1)},
        )).to.be.revertedWith('Invalid proof!');

        // Pause whitelist sale
        await contract.setWhitelistMintEnabled(false);

        // Check balances
        expect(await contract.balanceOf(await owner.getAddress())).to.equal(0);
        expect(await contract.balanceOf(await whitelistedUser.getAddress())).to.equal(2);
        expect(await contract.balanceOf(await freeUser.getAddress())).to.equal(0);
        expect(await contract.balanceOf(await holder.getAddress())).to.equal(0);
        expect(await contract.balanceOf(await externalUser.getAddress())).to.equal(0);
    });

    it('Free Mint', async function () {
        // Build MerkleTree
        const leafNodesFree = freeAddresses.map(addr => keccak256(addr));
        const merkleTreeFree = new MerkleTree(leafNodesFree, keccak256, { sortPairs: true });
        const rootHash2 = merkleTreeFree.getRoot();

        //WL 2
        const leafNodesWl = whitelistAddresses.map(addr => keccak256(addr));
        const merkleTreeWl = new MerkleTree(leafNodesWl, keccak256, { sortPairs: true });
        await (await contract.setMerkleRootFree('0x' + rootHash2.toString('hex'))).wait();


        await contract.setWhitelistMintEnabled(true);


        //Testing for Wl User 1 *max mint of 1*
        await contract.connect(freeUser).freeMint(
            1,
            merkleTreeFree.getHexProof(keccak256(await freeUser.getAddress())),
        );

        await contract.setWhitelistMintEnabled(false);
        await contract.setPaused(false);

        await contract.connect(freeUser).freeMint(
            1,
            merkleTreeFree.getHexProof(keccak256(await freeUser.getAddress())),
        );

        // Sending an invalid mint amount
        await expect(contract.connect(freeUser).freeMint(
0,
            merkleTreeFree.getHexProof(keccak256(await freeUser.getAddress())),
        )).to.be.revertedWith('Invalid mint amount!');


        // Trying to mint twice
        await expect(contract.connect(freeUser).freeMint(
            1,
            merkleTreeFree.getHexProof(keccak256(await freeUser.getAddress())),
        )).to.be.revertedWith('Address already claimed!');


        // Sending proof as a WL user from a free merkle tree
        await expect(contract.connect(whitelistedUser).freeMint(
            1,
            merkleTreeWl.getHexProof(keccak256(await freeUser.getAddress())),
        )).to.be.revertedWith('Invalid proof!');


        // Sending an invalid proof
        await expect(contract.connect(holder).freeMint(
            1,
            merkleTreeFree.getHexProof(keccak256(await holder.getAddress())),
        )).to.be.revertedWith('Invalid proof!');


        // Sending no proof at all
        await expect(contract.connect(holder).freeMint(
            1,
            [],
        )).to.be.revertedWith('Invalid proof!');

        // Pause whitelist sale
        await contract.setPaused(true);

        //Paused Whitelist sale (back to publicsale)

        // Check balances
        expect(await contract.balanceOf(await owner.getAddress())).to.equal(0);
        expect(await contract.balanceOf(await whitelistedUser.getAddress())).to.equal(2);
        expect(await contract.balanceOf(await freeUser.getAddress())).to.equal(2);
        expect(await contract.balanceOf(await holder.getAddress())).to.equal(0);
        expect(await contract.balanceOf(await externalUser.getAddress())).to.equal(0);
    });

    it('Public Mint', async function () {
        // Nobody should be able to mint from a paused contract
        await expect(contract.connect(owner).mint(1, {value: getPrice(SaleType.PUBLIC_SALE, 1)})).to.be.revertedWith("The contract is paused!");
        await expect(contract.connect(whitelistedUser).mint(1, {value: getPrice(SaleType.PUBLIC_SALE, 1)})).to.be.revertedWith("The contract is paused!");
        await (await contract.setPaused(false)).wait();
        await (await contract.connect(owner).mint(1, {value: getPrice(SaleType.PUBLIC_SALE, 1)})).wait();
        await (await contract.connect(holder).mint(1, {value: getPrice(SaleType.PUBLIC_SALE, 1)})).wait();
        await expect(contract.connect(holder).mint(1, {value: utils.parseEther("0.0001")})).to.be.revertedWith("Insufficient funds");

        await (await contract.setPaused(true)).wait();
    });

    it('Gen One Mint', async function () {
        // Nobody should be able to mint from a paused contract
        await expect(contract.connect(owner).mintGenOne(await owner.getAddress(), 'https://google.com')).to.be.revertedWith("Gen 1 can not mint yet!");
        await (await contract.setGenOneStarted(true)).wait();

        // The owner should be able to mint through dapp
        await (await contract.mintGenOne(await owner.getAddress(), 'https://google.com')).wait();
        await (await contract.mintGenOne(await holder.getAddress(), 'https://google.com')).wait();
        await (await contract.setGenOneStarted(false)).wait();
    });

    it('Balance of', async function () {
        expect(await contract.balanceOf(await owner.getAddress())).to.equal(2);
        expect(await contract.balanceOf(await whitelistedUser.getAddress())).to.equal(2);
        expect(await contract.balanceOf(await freeUser.getAddress())).to.equal(2);
        expect(await contract.balanceOf(await holder.getAddress())).to.equal(2);
        expect(await contract.balanceOf(await externalUser.getAddress())).to.equal(0);
    });
});
