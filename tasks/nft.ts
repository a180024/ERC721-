import { task } from "hardhat/config";
import { Contract, ContractFactory } from "ethers";
import { getWallet } from "../lib/wallet";

task("deploy-contract", "Deploy NFT contract").setAction(async (_, hre) => {
  return hre.ethers
    .getContractFactory("MyNFT", getWallet())
    .then((contractFactory: ContractFactory) =>
      contractFactory.deploy("MyNFT", "MyNFT", "ipfs.io/ipfs/", "1000")
    )
    .then((result: Contract) => {
      process.stdout.write(`Contract address: ${result.address}`);
    });
});
