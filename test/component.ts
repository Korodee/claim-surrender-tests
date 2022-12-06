import { expect } from 'chai';
import { utils } from 'ethers';
import { ethers } from 'hardhat';
import CollectionConfig from './../config/CollectionConfig';
import {KiteContractArguments, ComponentContractArguments} from '../config/ContractArguments';
import { ComponentContractType } from '../lib/NftContractProvider';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe(CollectionConfig.componentName, function () {
    let owner!: SignerWithAddress;
    let whitelistedUser!: SignerWithAddress;
    let holder!: SignerWithAddress;
    let holder2!: SignerWithAddress;
    let externalUser!: SignerWithAddress;
    let contract!: ComponentContractType;
    let kiteContractAddress!: string;

    before(async function () {
        [owner, whitelistedUser, holder, holder2, externalUser] = await ethers.getSigners();
    });

    it('Mock contract deployment', async function () {
        const MockKiteContract = await ethers.getContractFactory("KiteFighterMock");
        const contract = await MockKiteContract.deploy([holder.address, holder2.address]);

        kiteContractAddress = (await contract.deployed()).address;
    });

    it('Contract deployment', async function () {
        const Contract = await ethers.getContractFactory(CollectionConfig.componentName);
        const args = [
            CollectionConfig.builderContract,
            kiteContractAddress,
            CollectionConfig.componentMetadataUri,
            CollectionConfig.componentName,
            CollectionConfig.trustedForwarder,
        ]
        contract = await Contract.deploy(...args) as ComponentContractType;

        await contract.deployed();
    });

    it('Check initial data', async function () {
        expect(await contract.name()).to.equal(CollectionConfig.componentName);
        expect(await contract.trustedForwarder()).to.equal(CollectionConfig.trustedForwarder);
        expect(await contract.builderContract()).to.equal(CollectionConfig.builderContract);
        expect(await contract.kiteFighterContract()).to.equal(kiteContractAddress);
        expect(await contract.uri(0)).to.equal(CollectionConfig.componentMetadataUri);

        expect(await contract.saleIsActive()).to.equal(false);
        expect(await contract.publicSaleIsActive()).to.equal(false);
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

    it('Update Number of Components', async function () {
        const newNumber = 200;
        await (await contract.connect(owner).setNumberOfComponents(newNumber)).wait();
        expect(await contract.NUMBER_OF_COMPONENTS()).to.equal(newNumber);
    });

    it('Update URI', async function () {
        const newURI = "ipfs://QmZ5ev7yLZ91XuHTTNZiWCJ31SX5ruUoaymLJeSdBCU2Up/{id}.json";
        await (await contract.connect(owner).setURI(newURI)).wait();
        expect(await contract.uri(0)).to.equal(newURI);
    });

    it('Owner only functions', async function () {
        await expect(contract.connect(externalUser).setName("HACKED")).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).setNumberOfComponents(200)).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).setComponentPrice(utils.parseEther('0.0000001'))).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).setURI('INVALID_PREFIX')).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).dappMint(await externalUser.getAddress(), 0, 1)).to.be.revertedWith("Caller is not authorized to make the call");
        await expect(contract.connect(externalUser).burnBatch('0x4b0112CbC558439c5724E7E7A2F8752035b17190', [0, 1], [1, 1])).to.be.revertedWith("Caller is not authorized to make the call");
        await expect(contract.connect(externalUser).setBuilderContract('0x4b0112CbC558439c5724E7E7A2F8752035b17190')).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).setTrustedForwarder('0x4b0112CbC558439c5724E7E7A2F8752035b17190')).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).flipSaleState()).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).enablePublicMinting()).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).disablePublicMinting()).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).withdraw()).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Dapp Mint', async function () {
        // Nobody should be able to mint from a paused contract
        await expect(contract.connect(owner).dappMint(await owner.getAddress(), 0, 1)).to.be.revertedWith("Sale must be active to mint");
        await (await contract.flipSaleState()).wait();
        await expect(contract.connect(owner).dappMint(await owner.getAddress(), 0, 0)).to.be.revertedWith("Must must be a number larger than 0");

        // The owner should be able to mint through dapp
        await (await contract.dappMint(await owner.getAddress(), 0, 1)).wait();
        await (await contract.dappMint(await holder.getAddress(), 1, 2)).wait();
    });

    it('Public Mint', async function () {
        // Nobody should be able to mint from a paused contract
        await expect(contract.connect(owner).publicMint(0, {value: utils.parseEther("0.05")})).to.be.revertedWith("Public Sale must be active to mint");
        await expect(contract.connect(whitelistedUser).publicMint(0, {value: utils.parseEther("0.05")})).to.be.revertedWith("Public Sale must be active to mint");
        await (await contract.enablePublicMinting()).wait();
        await expect(contract.connect(owner).publicMint(0, {value: utils.parseEther("0.05")})).to.be.revertedWith("Address must own a KiteFighter");
        await expect(contract.connect(holder).publicMint(0, {value: utils.parseEther("0.04")})).to.be.revertedWith("Insufficient funds");

        // Holders should be able to mint through dapp only once after enabling public minting
        await (await contract.connect(holder).publicMint(1, {value: utils.parseEther("0.05")})).wait();
        await expect(contract.connect(holder).publicMint(0, {value: utils.parseEther("0.05")})).to.be.revertedWith("Address already minted a Component this week");
        await (await contract.connect(holder2).publicMint(2, {value: utils.parseEther("0.05")})).wait();

        // Holders should be able to mint through dapp again after a week
        await (await contract.enablePublicMinting()).wait();
        await (await contract.connect(holder).publicMint(2, {value: utils.parseEther("0.05")})).wait();
        await expect(contract.connect(holder).publicMint(2, {value: utils.parseEther("0.05")})).to.be.revertedWith("Address already minted a Component this week");

    });

    it('Balance of', async function () {
        expect(await contract.balanceOf(await owner.getAddress(), 0)).to.equal(1);
        expect(await contract.balanceOf(await holder.getAddress(), 1)).to.equal(3);
        expect(await contract.balanceOf(await holder.getAddress(), 2)).to.equal(1);
        expect(await contract.balanceOf(await holder2.getAddress(), 2)).to.equal(1);
    });
});
