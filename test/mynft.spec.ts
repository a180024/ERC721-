import { ethers, waffle } from "hardhat";
import { Contract, Wallet } from "ethers";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import sinon from "sinon";
import crypto from "crypto";
import { deployTestContract } from "./test-helper";
import * as provider from "../lib/provider";

chai.use(solidity);

describe("MyNFT", () => {
  const contractName: string = "MyNFT";
  const contractSymbol: string = "MyNFT";
  const contractBaseURI: string = "ipfs.io/ipfs/";

  let deployedContract: Contract;
  let wallet: Wallet;

  beforeEach(async () => {
    sinon.stub(provider, "getProvider").returns(waffle.provider);
    [wallet] = waffle.provider.getWallets();
    deployedContract = await deployTestContract(
      contractName,
      contractSymbol,
      contractBaseURI,
      20
    );
    // Minting inactive by default
    await deployedContract.switchMinting();
  });

  async function mintNFT(
    quantity: number,
    tokenURIArray: string[],
    value: number
  ): Promise<TransactionResponse> {
    return deployedContract.mintNFT(quantity, tokenURIArray, {
      value: value,
    });
  }

  function parseEther(value: number) {
    const _value = value.toString();
    return ethers.utils.parseEther(_value);
  }

  function generateRandomHash(length: number): string[] {
    let result = [];
    for (let i = 0; i < length; i++) {
      const hash = crypto.randomBytes(20).toString("hex");
      result.push(hash);
    }
    return result;
  }

  describe("Minting", async () => {
    it("Single mint", async () => {
      await expect(await deployedContract.balanceOf(wallet.address)).to.eq("0");
      await expect(await deployedContract.totalSupply()).to.eq(0);
      await mintNFT(
        1,
        ["QmRpaAA9Ef4oQGeNqYSaPoGnqgphhVnqoRFuaA18SF2Ep3"],
        parseEther(1)
      );
      expect(await deployedContract.balanceOf(wallet.address)).to.eq("1");
      await expect(await deployedContract.totalSupply()).to.eq(1);
    });
    it("Multiple mint", async () => {
      await expect(await deployedContract.balanceOf(wallet.address)).to.eq("0");
      await expect(await deployedContract.totalSupply()).to.eq(0);
      await mintNFT(
        2,
        [
          "QmRpaAA9Ef4oQGeNqYSaPoGnqgphhVnqoRFuaA18SF2Ep3",
          "RHAJrjlhxlrlrljlslallalRLlrRlAHSDKADKQEOQEWIbbb",
        ],
        parseEther(2)
      );
      expect(await deployedContract.balanceOf(wallet.address)).to.eq("2");
      await expect(await deployedContract.totalSupply()).to.eq(2);
    });
    it("Cannot mint more than 10 NFTs in one tx", async () => {
      await expect(await deployedContract.totalSupply()).to.eq(0);
      await mintNFT(11, generateRandomHash(11), parseEther(11)).catch((err) => {
        expect(
          err ===
            "VM Exception while processing transaction: reverted with reason string 'Cannot mint this number of NFTs in one go !'"
        );
      });
    });
    it("Cannot mint more than total supply", async () => {
      await expect(await deployedContract.totalSupply()).to.eq(0);
      await mintNFT(21, generateRandomHash(21), parseEther(21)).catch((err) => {
        expect(
          err ===
            "Error: VM Exception while processing transaction: reverted with reason string 'Only 1,000 NFTs are available'"
        );
      });
    });
    it("Reserve NFTs for team", async () => {
      await expect(await deployedContract.balanceOf(wallet.address)).to.eq("0");
      await expect(await deployedContract.totalSupply()).to.eq(0);
      await deployedContract.reserveNFTs(10, generateRandomHash(10));
      expect(await deployedContract.balanceOf(wallet.address)).to.eq("10");
      await expect(await deployedContract.totalSupply()).to.eq(10);
    });
  });

  describe("token", () => {
    it("Returns ipfs url", async () => {
      await mintNFT(
        1,
        ["QmRpaAA9Ef4oQGeNqYSaPoGnqgphhVnqoRFuaA18SF2Ep3"],
        parseEther(1)
      );
      await expect(await deployedContract.callStatic.tokenURI(0)).to.eq(
        "ipfs.io/ipfs/QmRpaAA9Ef4oQGeNqYSaPoGnqgphhVnqoRFuaA18SF2Ep3"
      );
    });
    it("Returns all tokenIds belonging to address", async () => {
      await mintNFT(
        2,
        [
          "QmRpaAA9Ef4oQGeNqYSaPoGnqgphhVnqoRFuaA18SF2Ep3",
          "RHAJrjlhxlrlrljlslallalRLlrRlAHSDKADKQEOQEWIbbb",
        ],
        parseEther(2)
      );
      const tokenIds = await deployedContract.callStatic.tokensOfOwner(
        wallet.address
      );
      const _tokenIds = tokenIds.map((res: any) => parseInt(res._hex, 16));
      expect(_tokenIds[0]).to.equal(0);
      expect(_tokenIds[1]).to.equal(1);
    });
  });

  // Use await expect(tx).to.changeEtherBalance(addr1, amount)
  describe("fees", () => {
    it("Check that contract earns fees", async () => {
      const initialContractBal = await waffle.provider.getBalance(
        deployedContract.address
      );
      const formattedInitialContractBal = ethers.utils.formatEther(
        initialContractBal.toString()
      );

      await mintNFT(
        1,
        ["QmRpaAA9Ef4oQGeNqYSaPoGnqgphhVnqoRFuaA18SF2Ep3"],
        parseEther(1)
      );

      const finalContractBal = await waffle.provider.getBalance(
        deployedContract.address
      );
      const formattedFinalContractBal = ethers.utils.formatEther(
        finalContractBal.toString()
      );

      expect(formattedFinalContractBal - formattedInitialContractBal).to.equal(
        1
      );
    });
    it("Withdraw fees from contract", async () => {
      const initalOwnerBal = await waffle.provider.getBalance(wallet.address);
      const formattedInitalOwnerBal = ethers.utils.formatEther(
        initalOwnerBal.toString()
      );

      await mintNFT(
        1,
        ["QmRpaAA9Ef4oQGeNqYSaPoGnqgphhVnqoRFuaA18SF2Ep3"],
        parseEther(1)
      );

      // Check that contract received fees
      const contractBal = await waffle.provider.getBalance(
        deployedContract.address
      );
      const formattedContractBal = ethers.utils.formatEther(
        contractBal.toString()
      );

      expect(formattedContractBal).to.equal("1.0");

      await deployedContract.withdrawBalance();

      const finalOwnerBal = await waffle.provider.getBalance(wallet.address);
      const formattedFinalOwnerBal = ethers.utils.formatEther(
        finalOwnerBal.toString()
      );

      const finalContractBal = await waffle.provider.getBalance(
        deployedContract.address
      );
      const formattedFinalContractBal = ethers.utils.formatEther(
        finalContractBal.toString()
      );

      expect(formattedFinalOwnerBal > formattedInitalOwnerBal);
      expect(formattedFinalContractBal).to.equal("0.0");
    });
  });
});
