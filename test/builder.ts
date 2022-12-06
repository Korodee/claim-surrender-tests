import { expect } from 'chai';
import { ethers } from 'hardhat';
import CollectionConfig from './../config/CollectionConfig';
import {
    BuilderContractType,
    ComponentMockContractType,
    KiteMockContractType
} from '../lib/NftContractProvider';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe(CollectionConfig.builderName, function () {
    let owner!: SignerWithAddress;
    let admin!: SignerWithAddress;
    let externalUser!: SignerWithAddress;
    let holder!: SignerWithAddress;
    let contract!: BuilderContractType;
    let kiteContract!: KiteMockContractType;
    let componentContract!: ComponentMockContractType;

    before(async function () {
        [owner, admin, externalUser, holder] = await ethers.getSigners();
    });

    it('Mock contracts deployment', async function () {
        const MockKiteContract = await ethers.getContractFactory("KiteFighterMock");
        kiteContract = await MockKiteContract.deploy([]) as KiteMockContractType;
        await kiteContract.deployed();

        const MockComponentContract = await ethers.getContractFactory("KiteComponentMock");
        componentContract = await MockComponentContract.deploy() as ComponentMockContractType;
        await componentContract.deployed();
    });

    it('Contract deployment', async function () {
        const Contract = await ethers.getContractFactory(CollectionConfig.builderName);
        const args = [
            CollectionConfig.admin,
            CollectionConfig.kiteContractAddress,
            CollectionConfig.componentContractAddress
        ]
        contract = await Contract.deploy(...args) as BuilderContractType;

        await contract.deployed();
    });

    it('Check initial data', async function () {
        expect(await contract.kiteComponentContractAddress()).to.equal(CollectionConfig.componentContractAddress);
        expect(await contract.kiteFighterContractAddress()).to.equal(CollectionConfig.kiteContractAddress);
        expect(await contract.admin()).to.equal(CollectionConfig.admin);
    });

    it('Set Builder Contract in mocks', async function () {
        await (await kiteContract.setBuilderContract(contract.address)).wait();
        await (await componentContract.setBuilderContract(contract.address)).wait();
    });

    it('Update Addresses', async function () {
        await (await contract.connect(owner).setContractAddresses(kiteContract.address, componentContract.address)).wait();
        expect(await contract.kiteFighterContractAddress()).to.equal(kiteContract.address);
        expect(await contract.kiteComponentContractAddress()).to.equal(componentContract.address);
    });

    it('Update Admin', async function () {
        const newAdmin = await admin.getAddress();
        await (await contract.connect(owner).setAdmin(newAdmin)).wait();
        expect(await contract.admin()).to.equal(newAdmin);
    });

    it('Owner only functions', async function () {
        await expect(contract.connect(externalUser).setAdmin(await externalUser.getAddress())).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(externalUser).setContractAddresses('0x4b0112CbC558439c5724E7E7A2F8752035b17190', '0x4b0112CbC558439c5724E7E7A2F8752035b17190')).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Build', async function () {
        // Nobody should be able to mint from a paused contract
        await expect(contract.connect(externalUser).buildKite([2, 1, 4], [1, 1, 1], await holder.getAddress(), "some url")).to.be.revertedWith("Only admin can build a kite, nice try!");
        await expect(contract.connect(owner).buildKite([2, 1, 4], [1, 1, 1], await holder.getAddress(), "some url")).to.be.revertedWith("Only admin can build a kite, nice try!");
        await expect(contract.connect(admin).buildKite([2, 1, 4], [1, 1, 1], await holder.getAddress(), "some url")).to.be.revertedWith("Burn batch did not pass");
        await (await componentContract.setBurnBatchShouldPass(true)).wait();
        await expect(contract.connect(admin).buildKite([2, 1, 4], [1, 1, 1], await holder.getAddress(), "some url")).to.be.revertedWith("Gen 1 can not mint yet!");
        await (await kiteContract.setGenOneStarted(true)).wait();
        await (await contract.connect(admin).buildKite([2, 1, 4], [1, 1, 1], await holder.getAddress(), "some url")).wait();
    });

    it('Mint Component', async function () {
        // Nobody should be able to mint from a paused contract
        await expect(contract.connect(externalUser).mintComponent(await holder.getAddress(), 2, 4)).to.be.revertedWith("Only admin can build a kite, nice try!");
        await expect(contract.connect(owner).mintComponent(await holder.getAddress(), 2, 4)).to.be.revertedWith("Only admin can build a kite, nice try!");
        await expect(contract.connect(admin).mintComponent(await holder.getAddress(), 2, 4)).to.be.revertedWith("Sale must be active to mint");
        await (await componentContract.flipSaleState()).wait();
        await (await contract.connect(admin).mintComponent(await holder.getAddress(), 2, 4)).wait();
        await expect(contract.connect(admin).mintComponent(await holder.getAddress(), 2, 0)).to.be.revertedWith("Must must be a number larger than 0");
    });
});
