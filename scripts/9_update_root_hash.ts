import {NftKiteContractProvider} from '../lib/NftContractProvider';
import CollectionConfig from "../config/CollectionConfig";
import keccak256 from "keccak256";
import {MerkleTree} from "merkletreejs";

async function main() {
    // Attach to deployed contract
    if (CollectionConfig.whitelistAddresses.length < 1) {
        throw 'The whitelist is empty, please add some addresses to the configuration.';
    }

    // Build the Merkle Tree
    const leafNodes = CollectionConfig.whitelistAddresses.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const rootHash = '0x' + merkleTree.getRoot().toString('hex');

    const contract = await NftKiteContractProvider.getContract();

    // Update root hash (if changed)
    console.log(`Updating the root hash to: ${rootHash}`);
    await (await contract.setMerkleRoot(rootHash)).wait();

    console.log('The Merkle Tree root hash for the current whitelist is: ' + rootHash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
