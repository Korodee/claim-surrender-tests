import {NftComponentContractProvider} from '../lib/NftContractProvider';
import CollectionConfig from "../config/CollectionConfig";

async function main() {
    // Attach to deployed contract
    const contract = await NftComponentContractProvider.getContract();

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
