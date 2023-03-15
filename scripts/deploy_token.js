// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {

  let owner = "0xceAd8d3BDff69a1a3aC9b266cA497D8619ec8305";
  const ERC20Mock = await hre.ethers.getContractFactory("ERC20Mock");
  const eRC20Mock = await ERC20Mock.deploy(owner, ethers.utils.parseEther("10"), 18);
  await eRC20Mock.deployed();
  const eRC20Mock2 = await ERC20Mock.deploy(owner, ethers.BigNumber.from(50).mul(ethers.BigNumber.from(10).pow(6)), 6);
  await eRC20Mock2.deployed();
  const eRC20Mock3 = await ERC20Mock.deploy(owner, ethers.utils.parseEther("100"), 18);
  await eRC20Mock3.deployed();

  console.log(
    `Deployed to (Tshifu) ${eRC20Mock.address}`
  );
  console.log(
    `Deployed to (Tusdt) ${eRC20Mock2.address}`
  );
  console.log(
    `Deployed to (Tuwu) ${eRC20Mock3.address}`
  );

  await hre.run("verify:verify", {
    address: eRC20Mock.address,
    constructorArguments: [owner, ethers.utils.parseEther("10"), 18],
  });
  await hre.run("verify:verify", {
    address: eRC20Mock2.address,
    constructorArguments: [owner, ethers.BigNumber.from(50).mul(ethers.BigNumber.from(10).pow(6)), 6],
  });
  await hre.run("verify:verify", {
    address: eRC20Mock3.address,
    constructorArguments: [owner, ethers.utils.parseEther("100"), 18],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
