// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {

  // let fromToken = "0x29127fe04ffa4c32acac0ffe17280abd74eac313"; //must be entered
  // let toTokens = ["0x55c08ca52497e2f1534b59e2917bf524d4765257", "0xdac17f958d2ee523a2206206994597c13d831ec7"]; //must be entered

  let fromToken = "0x8B6A212FBBD5eBc26f36a25e1E45D3088d70f4D0"; //must be entered
  let toTokens = ["0x32D168fc93A29C6A12D49e4316E4316dD6BD5b28", "0x46EbF7736b2FE2E4a79EdDBb2422fB86a21aE1b6"]; //must be entered

  let exchangeRates = [ethers.BigNumber.from(2).mul(ethers.BigNumber.from(10).pow(6)), ethers.BigNumber.from(3).mul(ethers.BigNumber.from(10).pow(18))]; //must be entered
  const Redemption = await hre.ethers.getContractFactory("Redemption");
  const redemption = await Redemption.deploy(fromToken, toTokens, exchangeRates);

  await redemption.deployed();

  console.log('Gas used:', redemption.gasUsed.toString());

  console.log(
    `Deployed to ${redemption.address}`
  );

  await hre.run("verify:verify", {
    address: redemption.address,
    constructorArguments: [fromToken, toTokens, exchangeRates],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
